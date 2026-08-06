import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/product/brand.entity';
import { Category } from '../entities/productCategory/category.entity';
import { BrandDto, CreateBrandDto, UpdateBrandDto } from '../dto/brand.dto';
import { PaginationDto, IdDto } from '../dto/common.dto';
import { successResponse } from '../commonServices/response.service';
import { Offer } from '../entities/product/offer.entity';
import { Product } from '../entities/product/product.entity';
import { In } from 'typeorm';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    try {
      const { categoryIds, offerIds, ...brandData } = createBrandDto;

      const brand = this.brandRepository.create(brandData);

      if (categoryIds && categoryIds.length > 0) {
        const categories = await this.categoryRepository.findByIds(categoryIds);
        if (categories.length !== categoryIds.length) {
          throw new NotFoundException('One or more categories not found');
        }
        brand.categories = categories;
      }

      if (offerIds && offerIds.length > 0) {
        const uniqueIds = [
          ...new Set(
            offerIds.map((v) => Number(v)).filter((v) => Number.isFinite(v)),
          ),
        ];
        const offers = await this.offerRepository.find({
          where: { id: In(uniqueIds) },
        });
        if (offers.length !== uniqueIds.length) {
          throw new NotFoundException('One or more offers not found');
        }
        (brand as any).offers = offers;
      }

      const result = await this.brandRepository.save(brand);
      return successResponse(result, 'Brand created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: any) {
    try {
      const { pageNumber, pageSize, search, column, order, categoryId } = query;
      const skip =
        pageNumber && pageSize
          ? (Number(pageNumber) - 1) * Number(pageSize)
          : 0;
      const take = pageSize ? Number(pageSize) : 10;

      const queryBuilder = this.brandRepository
        .createQueryBuilder('brand')
        .leftJoinAndSelect('brand.categories', 'categories')
        .leftJoinAndSelect('brand.products', 'products');

      // Add search filter if provided
      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere('brand.brandName LIKE :search', {
          search: `%${search}%`,
        });
      }

      // Add category filter if category ID is provided
      if (categoryId) {
        const categoryIdNum = Number(categoryId);
        queryBuilder.andWhere('categories.id = :categoryId', {
          categoryId: categoryIdNum,
        });
      }

      // Handle sorting with validation
      if (column && order) {
        // Validate column name to prevent SQL injection
        const allowedColumns = [
          'id',
          'brandName',
          'brandSlug',
          'createdAt',
          'updatedAt',
          'isActive',
        ];
        const columnName = column.trim();
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (allowedColumns.includes(columnName)) {
          queryBuilder.orderBy(`brand.${columnName}`, sortOrder);
        } else {
          // Default sorting if invalid column provided
          queryBuilder.orderBy('brand.id', 'ASC');
        }
      } else {
        // Default sorting by ID if no sort parameters provided
        queryBuilder.orderBy('brand.id', 'ASC');
      }

      queryBuilder.skip(skip).take(take);

      const [rows, count] = await queryBuilder.getManyAndCount();
      return successResponse({ rows, count }, 'Brands retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const brand = await this.brandRepository.findOne({
        where: { id },
        relations: ['categories', 'products', 'brandOffers'],
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      return successResponse(brand, 'Brand retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    try {
      const brand = await this.brandRepository.findOne({
        where: { id },
        relations: ['categories', 'brandOffers'],
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      const { categoryIds, offerIds, ...updateData } = updateBrandDto;

      Object.assign(brand, updateData);

      if (categoryIds !== undefined) {
        if (categoryIds && categoryIds.length > 0) {
          const categories =
            await this.categoryRepository.findByIds(categoryIds);
          if (categories.length !== categoryIds.length) {
            throw new NotFoundException('One or more categories not found');
          }
          brand.categories = categories;
        } else {
          brand.categories = [];
        }
      }

      if (offerIds !== undefined) {
        if (offerIds && offerIds.length > 0) {
          const uniqueIds = [
            ...new Set(
              offerIds.map((v) => Number(v)).filter((v) => Number.isFinite(v)),
            ),
          ];
          const offers = await this.offerRepository.find({
            where: { id: In(uniqueIds) },
          });
          if (offers.length !== uniqueIds.length) {
            throw new NotFoundException('One or more offers not found');
          }
          (brand as any).brandOffers = offers;
        } else {
          (brand as any).brandOffers = [];
        }
      }

      const result = await this.brandRepository.save(brand);
      return successResponse(result, 'Brand updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const brand = await this.brandRepository.findOne({ where: { id } });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      const deletedProducts = await this.brandRepository.manager.transaction(
        async (manager) => {
          const products = await manager.find(Product, {
            where: { brand: { id } },
            select: { id: true },
          });

          if (products.length > 0) {
            await manager.delete(
              Product,
              products.map((product) => product.id),
            );
          }

          await manager.remove(brand);

          return products.length;
        },
      );

      const message =
        deletedProducts > 0
          ? `Brand deleted successfully along with ${deletedProducts} related product(s).`
          : 'Brand deleted successfully';

      return successResponse({ deleted: true, deletedProducts }, message);
    } catch (error) {
      throw error;
    }
  }
}
