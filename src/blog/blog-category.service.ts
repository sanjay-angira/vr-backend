import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BlogCategory } from '../entities/blog/blog-category.entity';
import {
  CreateBlogCategoryDto,
  UpdateBlogCategoryDto,
} from '../dto/blog-category-tag.dto';
import { PaginationDto } from 'src/dto/common.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';

@Injectable()
export class BlogCategoryService {
  constructor(
    @InjectRepository(BlogCategory)
    private readonly categoryRepository: Repository<BlogCategory>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createDto: CreateBlogCategoryDto): Promise<any> {
    try {
      const existing = await this.categoryRepository.findOne({
        where: { slug: createDto.slug },
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }

      const category = this.categoryRepository.create(createDto);
      const result = await this.categoryRepository.save(category);
      return successResponse(result, 'Category created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<any> {
    const { pageNumber, pageSize, search, column, order } = paginationDto;
    const limit = this.utilityService.validatePageSize(pageSize)
      ? Number(pageSize)
      : 10;
    const page = this.utilityService.validatePageNumber(pageNumber)
      ? Number(pageNumber)
      : 1;
    const skip = (page - 1) * limit;

    const searchCondition = this.utilityService.validateSearch(search)
      ? { title: Like(`%${search}%`) }
      : {};
    const orderCondition =
      column && order
        ? { [column]: order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC' }
        : ({ id: 'DESC' } as any);

    try {
      const [rows, count] = await this.categoryRepository.findAndCount({
        where: searchCondition,
        order: orderCondition,
        skip,
        take: limit,
      });
      return successResponse(
        {
          rows,
          count,
        },
        'Categories fetched successfully',
        200,
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return successResponse(category, 'Category fetched successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateBlogCategoryDto): Promise<any> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      if (updateDto.slug) {
        const existing = await this.categoryRepository.findOne({
          where: { slug: updateDto.slug },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException('Category with this slug already exists');
        }
      }

      Object.assign(category, updateDto);
      const result = await this.categoryRepository.save(category);
      return successResponse(result, 'Category updated successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number): Promise<any> {
    try {
      const category = await this.findOne(id);
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      await this.categoryRepository.delete(id);
      return successResponse({}, 'Category deleted successfully', 200);
    } catch (error) {
      throw error;
    }
  }
}
