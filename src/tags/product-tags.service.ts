import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tags } from '../entities/product/tags.entity';
import { Product } from '../entities/product/product.entity';
import {
  CreateProductTagDto,
  UpdateProductTagDto,
} from '../dto/product-tag.dto';
import {
  successResponse,
  errorResponse,
} from '../commonServices/response.service';
import { UtilityService } from '../commonServices/utility.service';
import { PaginationDto } from '../dto/common.dto';

@Injectable()
export class ProductTagsService {
  constructor(
    @InjectRepository(Tags)
    private readonly tagRepo: Repository<Tags>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createDto: CreateProductTagDto) {
    try {
      const { tagName, tagSlug, isActive } = createDto;

      // Check if tag with same slug already exists for this product (optional check)
      const existing = await this.tagRepo.findOne({ where: { tagSlug } });
      if (existing) {
        throw new ConflictException(
          'Tag with this slug already exists for this product',
        );
      }

      const tag = this.tagRepo.create({
        tagName,
        tagSlug,
        isActive,
      });

      const result = await this.tagRepo.save(tag);
      return successResponse(result, 'Product tag created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(pagination: PaginationDto) {
    const { pageNumber, pageSize, search, column, order } = pagination;
    try {
      const limit = this.utilityService.validatePageSize(pageSize)
        ? Number(pageSize)
        : 10;
      const page = this.utilityService.validatePageNumber(pageNumber)
        ? Number(pageNumber)
        : 1;
      const skip = (page - 1) * limit;

      const queryBuilder = this.tagRepo.createQueryBuilder('tag');

      if (search) {
        queryBuilder.where('tag.tagName LIKE :search', {
          search: `%${search}%`,
        });
      }

      if (column && order) {
        queryBuilder.orderBy(
          `tag.${column}`,
          order.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        queryBuilder.orderBy('tag.id', 'DESC');
      }

      const [rows, count] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();
      return successResponse(
        { rows, count },
        'Product tags fetched successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const tag = await this.tagRepo.findOne({
        where: { id },
      });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      return successResponse(tag, 'Product tag fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateProductTagDto) {
    try {
      const tag = await this.tagRepo.findOne({
        where: { id },
      });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }

      Object.assign(tag, updateDto);
      const result = await this.tagRepo.save(tag);
      return successResponse(result, 'Product tag updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const tag = await this.tagRepo.findOne({ where: { id } });
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      await this.tagRepo.remove(tag);
      return successResponse({}, 'Product tag deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}
