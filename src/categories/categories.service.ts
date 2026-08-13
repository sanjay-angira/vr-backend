import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
        publishStatus,
        image: image ?? null,
        imageAltText: imageAltText ?? null,
        video: video ?? null,
        icon,
        showOnHomePage,
        parent,
        categoryOffers: offers,
      });

      if (seo) {
        category.seo = this.categorySeoRepo.create(seo);
      }

      const result = await this.categoryRepo.save(category);

      const fullResult = await this.categoryRepo.findOne({
        where: { id: result.id },
        relations: ['parent', 'categoryOffers', 'seo'],
      });

      return successResponse(fullResult, 'Category created', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
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

      const qb = this.categoryRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('category.categoryOffers', 'categoryOffers')
        .leftJoinAndSelect('category.seo', 'seo')
        .orderBy(`category.${column}`, order as 'ASC' | 'DESC')
        .skip(skip)
        .take(Number(limit));

      if (search && this.utilityService.validateSearch(search)) {
        qb.andWhere(
          '(category.categoryName ILIKE :search OR category.categorySlug ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const [rows, count] = await qb.getManyAndCount();
      return successResponse({ rows, count }, 'Categories fetched');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'categoryOffers', 'seo'],
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

      if (categoryName !== undefined) category.categoryName = categoryName;
      if (categorySlug !== undefined) category.categorySlug = categorySlug;
      if (shortDescription !== undefined)
        category.shortDescription = shortDescription;
      if (description !== undefined) category.description = description;
      if (isActive !== undefined) category.isActive = isActive;
      if (publishStatus !== undefined) category.publishStatus = publishStatus;
      if (icon !== undefined) category.icon = icon;
      if (showOnHomePage !== undefined)
        category.showOnHomePage = showOnHomePage;
      if (image !== undefined) category.image = image;
      if (imageAltText !== undefined) category.imageAltText = imageAltText;
      if (video !== undefined) category.video = video;

      if (seo) {
        if (category.seo) {
          Object.assign(category.seo, seo);
        } else {
          category.seo = this.categorySeoRepo.create(seo);
        }
      }

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

  async findById(dto: IdDto) {
    return this.findOne(dto.id);
  }

  async getNextLevel(parentId: number | null) {
    if (!parentId) {
      const category = await this.categoryRepo.find({
        where: { parent: IsNull() },
        order: { id: 'ASC' },
      });
      return successResponse(category, 'Categories fetched');
    }

    const category = await this.categoryRepo.find({
      where: { parent: { id: parentId } },
      order: { id: 'ASC' },
    });
    return successResponse(category, 'Categories fetched');
  }
}
