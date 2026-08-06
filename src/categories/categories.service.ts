import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { CategorySeo } from '../entities/productCategory/category-seo.entity';
import { Product } from '../entities/product/product.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { IdDto, PaginationDto } from 'src/dto/common.dto';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';
import { Offer } from 'src/entities/product/offer.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(CategorySeo)
    private readonly categorySeoRepo: Repository<CategorySeo>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const {
      offerIds,
      parentId,
      categoryName,
      categorySlug,
      shortDescription,
      description,
      isActive,
      image,
      seo,
      publishStatus,
      image3d,
      video,
      icon,
      imageAltText,
      showOnHomePage,
    } = createCategoryDto;
    try {
      let offers: Offer[] = [];
      let parent: Category | null = null;

      if (offerIds && offerIds.length > 0) {
        offers = await this.offerRepo.findByIds(offerIds);
        if (offers.length !== offerIds.length) {
          throw new NotFoundException('One or more offers not found');
        }
      }

      if (parentId) {
        parent = await this.categoryRepo.findOne({ where: { id: parentId } });
        if (!parent) throw new NotFoundException('Parent category not found');
      }

      const category = this.categoryRepo.create({
        categoryName,
        categorySlug,
        shortDescription,
        description,
        isActive: isActive ?? true,
        image,
        publishStatus,
        image3d,
        video,
        icon,
        imageAltText,
        showOnHomePage,
        parent,
        categoryOffers: offers,
      });

      // Attach SEO
      if (seo) {
        category.seo = this.categorySeoRepo.create(seo);
      }

      const result = await this.categoryRepo.save(category);

      // Reload with relations
      const fullResult = await this.categoryRepo.findOne({
        where: { id: result.id },
        relations: ['parent', 'categoryOffers', 'seo'],
      });

      return successResponse(fullResult, 'Category created', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(pagination: PaginationDto) {
    const { pageNumber, pageSize, search, column, order } = pagination;
    try {
      const isPageNumberValid =
        this.utilityService.validatePageNumber(pageNumber);
      const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
      const queryBuilder = this.categoryRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('category.children', 'children')
        .leftJoinAndSelect('category.categoryOffers', 'categoryOffers')
        .leftJoinAndSelect('category.seo', 'seo');

      if (isPageNumberValid && isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        queryBuilder.skip(skip).take(Number(pageSize));
      }

      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere('category.categoryName LIKE :search', {
          search: `%${search}%`,
        });
      }

      if (column && order) {
        queryBuilder.orderBy(
          `category.${column}`,
          order.toUpperCase() as 'ASC' | 'DESC',
        );
      }

      const [rows, count] = await queryBuilder.getManyAndCount();
      return successResponse({ rows, count }, 'Categories fetched');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'children', 'categoryOffers', 'seo'],
      });
      if (!category) throw new NotFoundException('Category not found');
      return successResponse(category, 'Category fetched');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const {
      offerIds,
      parentId,
      categoryName,
      categorySlug,
      shortDescription,
      description,
      isActive,
      image,
      seo,
      publishStatus,
      image3d,
      video,
      icon,
      imageAltText,
      showOnHomePage,
    } = updateCategoryDto;
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ['categoryOffers', 'seo'],
      });
      if (!category) throw new NotFoundException('Category not found');

      if (parentId !== undefined) {
        if (parentId === null) {
          category.parent = null;
        } else if (parentId) {
          const parent = await this.categoryRepo.findOne({
            where: { id: parentId },
          });
          if (!parent) throw new NotFoundException('Parent category not found');
          category.parent = parent;
        }
      }

      // Update category properties
      if (categoryName !== undefined) category.categoryName = categoryName;
      if (categorySlug !== undefined) category.categorySlug = categorySlug;
      if (shortDescription !== undefined)
        category.shortDescription = shortDescription;
      if (description !== undefined) category.description = description;
      if (isActive !== undefined) category.isActive = isActive;
      if (image !== undefined) category.image = image;
      if (publishStatus !== undefined) category.publishStatus = publishStatus;
      if (image3d !== undefined) category.image3d = image3d;
      if (video !== undefined) category.video = video;
      if (icon !== undefined) category.icon = icon;
      if (imageAltText !== undefined) category.imageAltText = imageAltText;
      if (showOnHomePage !== undefined)
        category.showOnHomePage = showOnHomePage;

      // Update or create SEO
      if (seo) {
        if (category.seo) {
          Object.assign(category.seo, seo);
        } else {
          category.seo = this.categorySeoRepo.create(seo);
        }
      }

      // Handle offer associations if provided
      if (offerIds !== undefined) {
        if (offerIds && offerIds.length > 0) {
          const offers = await this.offerRepo.findByIds(offerIds);
          if (offers.length !== offerIds.length) {
            throw new NotFoundException('One or more offers not found');
          }
          category.categoryOffers = offers;
        } else {
          category.categoryOffers = [];
        }
      }

      await this.categoryRepo.save(category);

      // Reload with relations
      const fullResult = await this.categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'categoryOffers', 'seo'],
      });

      return successResponse(fullResult, 'Category updated');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // First check if there are any products associated with this category
      const productCount = await this.productsRepo.count({
        where: { category: { id } },
      });

      if (productCount > 0) {
        return errorResponse(
          `Cannot delete category because ${productCount} product(s) are still associated with it. Please reassign or delete the products first.`,
          400,
        );
      }

      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) throw new NotFoundException('Category not found');

      await this.categoryRepo.remove(category);
      return successResponse({ deleted: true }, 'Category deleted');
    } catch (error) {
      throw error;
    }
  }

  async getNextLevel(parentId: number | null) {
    // If parentId is null, fetch root categories
    if (!parentId) {
      const category = await this.categoryRepo.find({
        where: { parent: { id: undefined } },
        order: { id: 'ASC' },
      });
      return successResponse(category, 'Categories fetched');
    }

    // Fetch direct children
    const category = await this.categoryRepo.find({
      where: { parent: { id: parentId } },
      order: { id: 'ASC' },
    });
    return successResponse(category, 'Categories fetched');
  }
}
