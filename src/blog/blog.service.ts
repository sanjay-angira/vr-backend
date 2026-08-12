import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogTag } from 'src/entities/blog/blog-tag.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { BlogImage } from 'src/entities/blog/blog-image.entity';
import { CreateBlogDto } from '../dto/blog.dto';
import { UpdateBlogDto } from '../dto/blog.dto';
import { PaginationDto } from '../dto/common.dto';
import { successResponse } from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';
import { resolveImageAsset } from 'src/commonServices/image-asset.util';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(BlogTag)
    private readonly blogTagRepository: Repository<BlogTag>,
    @InjectRepository(BlogCategory)
    private readonly categoryRepository: Repository<BlogCategory>,
    @InjectRepository(BlogImage)
    private readonly blogImageRepository: Repository<BlogImage>,
    private readonly utilityService: UtilityService,
  ) {}

  private presentBlog(blog: BlogPost) {
    const img = [...(blog.images || [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )[0];
    return {
      ...blog,
      blogImage: img?.originalUrl ?? null,
      blogImageAlt: img?.altText ?? null,
    };
  }

  private async upsertBlogImage(
    blogId: number,
    url: string | null | undefined,
    altText?: string | null,
  ) {
    const resolved = resolveImageAsset(url, null);
    if (!resolved?.originalUrl) {
      await this.blogImageRepository.delete({ blog: { id: blogId } });
      return;
    }

    await this.blogImageRepository.delete({ blog: { id: blogId } });
    await this.blogImageRepository.save(
      this.blogImageRepository.create({
        blog: { id: blogId } as BlogPost,
        originalUrl: resolved.originalUrl,
        webp400: resolved.webp400 ?? null,
        jpg400: resolved.jpg400 ?? null,
        webp800: resolved.webp800 ?? null,
        jpg800: resolved.jpg800 ?? null,
        webp1200: resolved.webp1200 ?? null,
        jpg1200: resolved.jpg1200 ?? null,
        altText: altText ?? null,
        sortOrder: 0,
      }),
    );
  }

  async create(createBlogDto: CreateBlogDto): Promise<any> {
    const {
      tagIds,
      categoryId,
      seo,
      blogImage,
      blogImageAlt,
      ...blogData
    } = createBlogDto;

    const blog = this.blogRepository.create(blogData);

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (category) {
        blog.category = category;
      }
    }

    if (tagIds && tagIds.length > 0) {
      const tags = await this.blogTagRepository.findBy({ id: In(tagIds) });
      blog.tags = tags;
    }

    if (seo) {
      blog.seo = seo as any;
    }

    const response = await this.blogRepository.save(blog);

    await this.upsertBlogImage(response.id, blogImage, blogImageAlt);

    const full = await this.blogRepository.findOne({
      where: { id: response.id },
      relations: ['category', 'tags', 'seo', 'images'],
    });

    return successResponse(
      full ? this.presentBlog(full) : full,
      'Blog created successfully',
      201,
    );
  }

  async findAll(paginationDto: PaginationDto): Promise<any> {
    const {
      pageNumber,
      pageSize,
      search,
      column = 'id',
      order = 'DESC',
    } = paginationDto;

    const page = this.utilityService.validatePageNumber(pageNumber)
      ? pageNumber
      : 1;
    const limit = this.utilityService.validatePageSize(pageSize)
      ? pageSize
      : 10;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const isSearchValid = this.utilityService.validateSearch(search);
    const whereCondition = isSearchValid ? { title: Like(`%${search}%`) } : {};

    const [rows, count] = await this.blogRepository.findAndCount({
      where: whereCondition,
      relations: ['category', 'tags', 'seo', 'images'],
      order: { [column]: order },
      skip,
      take,
    });

    return successResponse(
      { rows: rows.map((row) => this.presentBlog(row)), count },
      'Blogs fetched successfully',
      200,
    );
  }

  async findOne(id: number): Promise<any> {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo', 'images'],
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    return successResponse(
      this.presentBlog(blog),
      'Blog fetched successfully',
      200,
    );
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<any> {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo', 'images'],
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    const {
      tagIds,
      categoryId,
      seo,
      blogImage,
      blogImageAlt,
      ...updateData
    } = updateBlogDto;

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (category) {
        blog.category = category;
      }
    }

    if (tagIds) {
      const tags = await this.blogTagRepository.findBy({ id: In(tagIds) });
      blog.tags = tags;
    }

    if (seo) {
      if (blog.seo) {
        Object.assign(blog.seo, seo);
      } else {
        blog.seo = seo as any;
      }
    }

    Object.assign(blog, updateData);
    await this.blogRepository.save(blog);

    if (blogImage !== undefined || blogImageAlt !== undefined) {
      const existing = [...(blog.images || [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      )[0];
      await this.upsertBlogImage(
        id,
        blogImage !== undefined ? blogImage : existing?.originalUrl,
        blogImageAlt !== undefined ? blogImageAlt : existing?.altText,
      );
    }

    const full = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo', 'images'],
    });

    return successResponse(
      full ? this.presentBlog(full) : full,
      'Blog updated successfully',
      200,
    );
  }

  async remove(id: number): Promise<any> {
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    await this.blogRepository.remove(blog);
    return successResponse(null, 'Blog deleted successfully', 200);
  }
}
