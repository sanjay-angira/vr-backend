import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { Product } from 'src/entities/product/product.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { PaginationDto } from 'src/dto/common.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly utilityService: UtilityService,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { pageNumber, pageSize, search, column, order } = paginationDto;
    try {
      const isPageNumberValid =
        this.utilityService.validatePageNumber(pageNumber);
      const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
      const queryBuilder = await this.productsRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.productOffers', 'productOffers');

      if (isPageNumberValid || isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        queryBuilder.skip(skip).take(Number(pageSize));
      }

      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere('product.productName LIKE :search', {
          search: `%${search}%`,
        });
      }

      if (column && order) {
        queryBuilder.orderBy(
          `product.${column}`,
          order.toUpperCase() as 'ASC' | 'DESC',
        );
      }

      const [rows, count] = await queryBuilder.getManyAndCount();
      return successResponse({ rows, count }, 'Products retrieved');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.productsRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('product.productOffers', 'productOffers')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.productTags', 'productTags')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.productAttributes', 'productAttributes')
        .leftJoinAndSelect('productAttributes.attribute', 'productAttribute')
        .leftJoinAndSelect('product.seo', 'seo')
        .leftJoinAndSelect('variants.images', 'variantImages')
        .leftJoinAndSelect('variants.variantAttributes', 'variantAttributes')
        .leftJoinAndSelect('variantAttributes.attribute', 'variantAttribute')
        .leftJoinAndSelect(
          'variants.productVariantOffers',
          'productVariantOffers',
        )
        .leftJoinAndSelect(
          'product.frequentlyBoughtTogether',
          'frequentlyBoughtTogether',
        ) // optional
        .where('product.id = :id', { id })
        .getOne();

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      /* ===============================
               LOAD CATEGORY HIERARCHY
            =============================== */
      if (product.category) {
        const categoryWithHierarchy = await this.loadCompleteCategoryHierarchy(
          product.category.id,
          new Set(),
        );

        if (categoryWithHierarchy) {
          product.category = categoryWithHierarchy;
        }
      }

      /* ===============================
               SANITIZE RESPONSE
            =============================== */
      try {
        // Remove heavy or circular relations
        delete (product as any).relatedTo;
        delete (product as any).reviews;
        delete (product as any).faqs;

        // Prevent circular inside frequentlyBoughtTogether
        if (product.frequentlyBoughtTogether) {
          product.frequentlyBoughtTogether =
            product.frequentlyBoughtTogether.map((p) => ({
              id: p.id,
              productName: p.productName,
              productSlug: p.productSlug,
            })) as any;
        }
      } catch (e) {
        // ignore sanitization errors
      }

      return successResponse(product, 'Product retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  private async loadCompleteCategoryHierarchy(
    categoryId: number,
    visited: Set<number> = new Set(),
  ): Promise<Category | null> {
    // If we've already visited this categoryId, break the cycle
    if (visited.has(categoryId)) {
      return null;
    }

    visited.add(categoryId);

    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: ['parent'],
    });

    // If this category has a parent, recursively load the parent hierarchy
    if (
      category &&
      category.parent &&
      category.parent.id &&
      !visited.has(category.parent.id)
    ) {
      const parent = await this.loadCompleteCategoryHierarchy(
        category.parent.id,
        visited,
      );
      category.parent = parent as Category;
    }

    return category;
  }

  async remove(id: number) {
    try {
      const product = await this.productsRepo.findOne({ where: { id } });
      if (!product) return errorResponse('Product not found', 404);
      await this.productsRepo.remove(product);
      return successResponse(null, 'Product deleted');
    } catch (error) {
      throw error;
    }
  }
}
