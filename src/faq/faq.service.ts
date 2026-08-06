import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from '../entities/product/faq.entity';
import { Product } from '../entities/product/product.entity';
import { CreateFaqDto } from '../dto/faq.dto';
import {
  successResponse,
  errorResponse,
} from '../commonServices/response.service';
import { IdDto, PaginationDto } from '../dto/common.dto';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createFaqDto: CreateFaqDto) {
    try {
      const product = await this.productRepository.findOne({
        where: { id: createFaqDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const faq = this.faqRepository.create({
        ...createFaqDto,
        product,
        sortOrder: createFaqDto.sortOrder ?? 0,
        isActive: createFaqDto.isActive ?? true,
      });

      const savedFaq = await this.faqRepository.save(faq);
      return successResponse(savedFaq, 'FAQ created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { pageNumber, pageSize, search, column, order } = paginationDto;
      const queryBuilder = this.faqRepository
        .createQueryBuilder('faq')
        .leftJoinAndSelect('faq.product', 'product');

      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere(
          '(faq.question ILIKE :search OR faq.answer ILIKE :search)',
          {
            search: `%${search}%`,
          },
        );
      }

      // Handle sorting with validation
      if (column && order) {
        // Validate column name to prevent SQL injection
        const allowedColumns = [
          'id',
          'question',
          'answer',
          'sortOrder',
          'isActive',
          'createdAt',
          'updatedAt',
          'productId',
        ];
        const columnName = column.trim();
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (allowedColumns.includes(columnName)) {
          queryBuilder.orderBy(`faq.${columnName}`, sortOrder);
        } else {
          // Default sorting if invalid column provided
          queryBuilder.orderBy('faq.id', 'ASC');
        }
      } else {
        // Default sorting by ID if no sort parameters provided
        queryBuilder.orderBy('faq.id', 'ASC');
      }

      if (pageNumber && pageSize) {
        const page_number = Number(pageNumber);
        const page_size = Number(pageSize);
        queryBuilder.skip((page_number - 1) * page_size).take(page_size);
      }

      const [rows, count] = await queryBuilder.getManyAndCount();
      return successResponse({ rows, count }, 'FAQs retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const faq = await this.faqRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!faq) {
        throw new NotFoundException('FAQ not found');
      }

      return successResponse(faq, 'FAQ retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findByProductId(productId: number) {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const faqs = await this.faqRepository.find({
        where: { productId, isActive: true },
        order: { sortOrder: 'ASC' },
      });

      return successResponse(faqs, 'Product FAQs retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateFaqDto: Partial<CreateFaqDto>) {
    try {
      const faq = await this.faqRepository.findOne({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ not found');
      }

      // If productId is provided, check if product exists
      if (updateFaqDto.productId) {
        const product = await this.productRepository.findOne({
          where: { id: updateFaqDto.productId },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        faq.product = product;
        faq.productId = updateFaqDto.productId;
      }

      // Update other fields if provided
      if (updateFaqDto.question !== undefined) {
        faq.question = updateFaqDto.question;
      }
      if (updateFaqDto.answer !== undefined) {
        faq.answer = updateFaqDto.answer;
      }
      if (updateFaqDto.sortOrder !== undefined) {
        faq.sortOrder = updateFaqDto.sortOrder;
      }
      if (updateFaqDto.isActive !== undefined) {
        faq.isActive = updateFaqDto.isActive;
      }

      const updatedFaq = await this.faqRepository.save(faq);
      return successResponse(updatedFaq, 'FAQ updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const faq = await this.faqRepository.findOne({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ not found');
      }

      await this.faqRepository.remove(faq);
      return successResponse(null, 'FAQ deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}
