import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogTag } from 'src/entities/blog/blog-tag.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { CreateBlogDto } from '../dto/blog.dto';
import { UpdateBlogDto } from '../dto/blog.dto';
import { PaginationDto } from '../dto/common.dto';
import { successResponse } from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(BlogTag)
    private readonly blogTagRepository: Repository<BlogTag>,
    @InjectRepository(BlogCategory)
    private readonly categoryRepository: Repository<BlogCategory>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createBlogDto: CreateBlogDto): Promise<any> {
    const { tagIds, categoryId, seo, ...blogData } = createBlogDto;

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

    const full = await this.blogRepository.findOne({
      where: { id: response.id },
      relations: ['category', 'tags', 'seo'],
    });

    return successResponse(full, 'Blog created successfully', 201);
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
      relations: ['category', 'tags', 'seo'],
      order: { [column]: order },
      skip,
      take,
    });

    return successResponse({ rows, count }, 'Blogs fetched successfully', 200);
  }

  async findOne(id: number): Promise<any> {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo'],
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    return successResponse(blog, 'Blog fetched successfully', 200);
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<any> {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo'],
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    const { tagIds, categoryId, seo, ...updateData } = updateBlogDto;

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

    const full = await this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'seo'],
    });

    return successResponse(full, 'Blog updated successfully', 200);
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
