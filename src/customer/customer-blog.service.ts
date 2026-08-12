import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { successResponse } from 'src/commonServices/response.service';
import { pickOptimizedImageUrl } from 'src/commonServices/image-url.util';
import { blogImageAlt, blogImageSource } from 'src/commonServices/image-relation.util';

@Injectable()
export class CustomerBlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(BlogCategory)
    private readonly categoryRepository: Repository<BlogCategory>,
  ) {}

  async getBlogs(query: {
    pageNumber?: string | number;
    pageSize?: string | number;
    search?: string;
    categorySlug?: string;
  }) {
    const pageNumber = Math.max(1, Number(query.pageNumber) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 12));
    const search = query.search?.trim();
    const categorySlug = query.categorySlug?.trim();

    const qb = this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.images', 'images')
      .where('blog.isActive = :isActive', { isActive: true })
      .andWhere('blog.status = :status', { status: 'published' })
      .orderBy('blog.publishedAt', 'DESC')
      .addOrderBy('blog.id', 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    if (search) {
      qb.andWhere(
        '(blog.title ILIKE :search OR blog.excerpt ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
      qb.andWhere('category.isActive = :categoryActive', {
        categoryActive: true,
      });
    }

    const [rows, count] = await qb.getManyAndCount();

    return successResponse(
      {
        rows: rows.map((blog) => this.mapListCard(blog)),
        count,
        pageNumber,
        pageSize,
      },
      'Blogs retrieved successfully',
    );
  }

  async getBlogBySlug(slug: string) {
    const blog = await this.blogRepository.findOne({
      where: { slug, isActive: true, status: 'published' },
      relations: ['category', 'tags', 'seo', 'images'],
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return successResponse(this.mapDetail(blog), 'Blog retrieved successfully');
  }

  async getBlogFilters() {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { title: 'ASC' },
    });

    return successResponse(
      {
        categories: categories.map((category) => ({
          id: category.id,
          title: category.title,
          slug: category.slug,
        })),
      },
      'Blog filters retrieved successfully',
    );
  }

  private formatDate(value: Date | string | null | undefined) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private mapListCard(blog: BlogPost) {
    const source = blogImageSource(blog);

    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      image: pickOptimizedImageUrl(source, 400, 'webp') || null,
      imageAlt: blogImageAlt(blog, blog.title),
      category: blog.category?.title || 'Blog',
      categorySlug: blog.category?.slug || null,
      date: this.formatDate(blog.publishedAt || blog.createdAt),
      readingTime: blog.readingTime || 0,
      isFeatured: Boolean(blog.isFeatured),
      href: `/blog/${blog.slug}`,
    };
  }

  private mapDetail(blog: BlogPost) {
    const main = blogImageSource(blog);

    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image: pickOptimizedImageUrl(main, 1200, 'webp') || null,
      imageAlt: blogImageAlt(blog, blog.title),
      category: blog.category
        ? {
            id: blog.category.id,
            title: blog.category.title,
            slug: blog.category.slug,
          }
        : null,
      tags: (blog.tags || []).map((tag) => ({
        id: tag.id,
        title: tag.title,
        slug: tag.slug,
      })),
      faqs: Array.isArray(blog.faqs) ? blog.faqs : [],
      date: this.formatDate(blog.publishedAt || blog.createdAt),
      readingTime: blog.readingTime || 0,
      isFeatured: Boolean(blog.isFeatured),
      seo: blog.seo || null,
    };
  }
}
