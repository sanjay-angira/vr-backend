import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { successResponse } from 'src/commonServices/response.service';

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
    const parsedPage = Number(query.pageNumber);
    const parsedSize = Number(query.pageSize);
    const pageNumber =
      Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize =
      Number.isFinite(parsedSize) && parsedSize > 0
        ? Math.min(parsedSize, 48)
        : 12;
    const search = query.search?.trim();
    const categorySlug = query.categorySlug?.trim();

    const qb = this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.tags', 'tags')
      .where('blog.isActive = :isActive', { isActive: true })
      .andWhere('blog.status = :status', { status: 'published' });

    if (search) {
      qb.andWhere(
        `(blog.title ILIKE :search
          OR blog.excerpt ILIKE :search
          OR blog.slug ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
      qb.andWhere('category.isActive = :categoryActive', {
        categoryActive: true,
      });
    }

    qb.orderBy('blog.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('blog.createdAt', 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

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

  async getBlogBySlug(slug: string) {
    const normalized = slug?.trim();
    if (!normalized) {
      throw new NotFoundException('Blog not found');
    }

    const blog = await this.blogRepository.findOne({
      where: {
        slug: normalized,
        isActive: true,
        status: 'published',
      },
      relations: ['category', 'tags', 'seo'],
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug "${normalized}" not found`);
    }

    // Fire-and-forget view increment
    void this.blogRepository.increment({ id: blog.id }, 'views', 1);

    const related = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .where('blog.isActive = :isActive', { isActive: true })
      .andWhere('blog.status = :status', { status: 'published' })
      .andWhere('blog.id != :id', { id: blog.id })
      .andWhere(
        blog.category?.id ? 'category.id = :categoryId' : '1=1',
        blog.category?.id ? { categoryId: blog.category.id } : {},
      )
      .orderBy('blog.publishedAt', 'DESC', 'NULLS LAST')
      .take(3)
      .getMany();

    return successResponse(
      {
        ...this.mapDetail(blog),
        related: related.map((item) => this.mapListCard(item)),
      },
      'Blog retrieved successfully',
    );
  }

  private formatDate(value: Date | string | null | undefined): string {
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
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      image: blog.thumbnailImage || blog.blogImage || null,
      imageAlt: blog.blogImageAlt || blog.title,
      category: blog.category?.title || 'Blog',
      categorySlug: blog.category?.slug || null,
      date: this.formatDate(blog.publishedAt || blog.createdAt),
      readingTime: blog.readingTime || 0,
      isFeatured: Boolean(blog.isFeatured),
      href: `/blog/${blog.slug}`,
    };
  }

  private mapDetail(blog: BlogPost) {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image: blog.blogImage || blog.thumbnailImage || null,
      thumbnailImage: blog.thumbnailImage || null,
      imageAlt: blog.blogImageAlt || blog.title,
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
      publishedAt: blog.publishedAt,
      readingTime: blog.readingTime || 0,
      views: blog.views || 0,
      isFeatured: Boolean(blog.isFeatured),
      seo: blog.seo
        ? {
            metaTitle: blog.seo.metaTitle || null,
            metaDescription: blog.seo.metaDescription || null,
            canonicalUrl: blog.seo.canonicalUrl || null,
            ogTitle: blog.seo.ogTitle || null,
            ogDescription: blog.seo.ogDescription || null,
            ogImage: blog.seo.ogImage || null,
          }
        : null,
    };
  }
}
