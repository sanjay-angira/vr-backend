import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { BlogTag } from '../entities/blog/blog-tag.entity';
import {
  CreateBlogTagDto,
  UpdateBlogTagDto,
} from '../dto/blog-category-tag.dto';
import { PaginationDto } from 'src/dto/common.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';

@Injectable()
export class BlogTagService {
  constructor(
    @InjectRepository(BlogTag)
    private readonly tagRepository: Repository<BlogTag>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createDto: CreateBlogTagDto): Promise<any> {
    try {
      const existing = await this.tagRepository.findOne({
        where: { slug: createDto.slug },
      });
      if (existing) {
        throw new ConflictException('Tag with this slug already exists');
      }

      const tag = this.tagRepository.create(createDto);
      const result = await this.tagRepository.save(tag);
      return successResponse(result, 'Tag created successfully', 201);
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
      const [rows, count] = await this.tagRepository.findAndCount({
        where: searchCondition,
        order: orderCondition,
        skip,
        take: limit,
      });

      return successResponse({ rows, count }, 'Tags fetched successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      const tag = await this.tagRepository.findOne({ where: { id } });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      return successResponse(tag, 'Tag fetched successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateBlogTagDto): Promise<any> {
    try {
      const tag = await this.tagRepository.findOne({ where: { id } });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }

      if (updateDto.slug) {
        const existing = await this.tagRepository.findOne({
          where: { slug: updateDto.slug },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException('Tag with this slug already exists');
        }
      }

      Object.assign(tag, updateDto);
      const result = await this.tagRepository.save(tag);
      return successResponse(result, 'Tag updated successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number): Promise<any> {
    try {
      const tag = await this.tagRepository.findOne({ where: { id } });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      await this.tagRepository.delete(id);
      return successResponse({}, 'Tag deleted successfully', 200);
    } catch (error) {
      throw error;
    }
  }
}
