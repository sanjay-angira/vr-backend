import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { CategorySeo } from '../entities/productCategory/category-seo.entity';
import { CategoryImage } from '../entities/productCategory/category-image.entity';
import { Product } from '../entities/product/product.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { IdDto, PaginationDto } from 'src/dto/common.dto';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';
import { Offer } from 'src/entities/product/offer.entity';
import { resolveImageAsset } from 'src/commonServices/image-asset.util';

type CategoryMediaInput = {
  image?: string | null;
  image3d?: string | null;
  video?: string | null;
  imageAltText?: string | null;
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(CategorySeo)
    private readonly categorySeoRepo: Repository<CategorySeo>,
    @InjectRepository(CategoryImage)
    private readonly categoryImageRepo: Repository<CategoryImage>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    private readonly utilityService: UtilityService,
  ) {}

  /** Flatten primary CategoryImage onto response for admin/legacy clients. */
  private presentCategory(category: Category) {
    const img = [...(category.images || [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )[0];

    return {
      ...category,
      image: img?.originalUrl ?? null,
      image3d: img?.image3d ?? null,
      video: img?.video ?? null,
      imageAltText: img?.altText ?? null,
    };
  }

  private async upsertCategoryMedia(
    categoryId: number,
    input: CategoryMediaInput,
  ) {
    const hasMediaUpdate =
      input.image !== undefined ||
      input.image3d !== undefined ||
      input.video !== undefined ||
      input.imageAltText !== undefined;

    if (!hasMediaUpdate) return;

    let row = await this.categoryImageRepo.findOne({
      where: { category: { id: categoryId } },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    const resolved =
      input.image !== undefined
        ? resolveImageAsset(input.image, null)
        : null;

    if (!row) {
      if (!resolved?.originalUrl) {
        // No primary image yet — nothing to attach 3d/video/alt to.
        return;
      }
      row = this.categoryImageRepo.create({
        category: { id: categoryId } as Category,
        originalUrl: resolved.originalUrl,
        webp400: resolved.webp400 ?? null,
        jpg400: resolved.jpg400 ?? null,
        webp800: resolved.webp800 ?? null,
        jpg800: resolved.jpg800 ?? null,
        altText: input.imageAltText ?? null,
        image3d: input.image3d ?? null,
        video: input.video ?? null,
        sortOrder: 0,
      });
      await this.categoryImageRepo.save(row);
      return;
    }

    if (resolved?.originalUrl) {
      row.originalUrl = resolved.originalUrl;
      row.webp400 = resolved.webp400 ?? null;
      row.jpg400 = resolved.jpg400 ?? null;
      row.webp800 = resolved.webp800 ?? null;
      row.jpg800 = resolved.jpg800 ?? null;
    } else if (input.image === null || input.image === '') {
      // Clearing the main image removes the media row.
      await this.categoryImageRepo.delete({ id: row.id });
      return;
    }

    if (input.imageAltText !== undefined) {
      row.altText = input.imageAltText;
    }
    if (input.image3d !== undefined) {
      row.image3d = input.image3d;
    }
    if (input.video !== undefined) {
      row.video = input.video;
    }

    await this.categoryImageRepo.save(row);
  }

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
        publishStatus,
        icon,
        showOnHomePage,
        parent,
        categoryOffers: offers,
      });

      if (seo) {
        category.seo = this.categorySeoRepo.create(seo);
      }

      const result = await this.categoryRepo.save(category);

      await this.upsertCategoryMedia(result.id, {
        image,
        image3d,
        video,
        imageAltText,
      });

      const fullResult = await this.categoryRepo.findOne({
        where: { id: result.id },
        relations: ['parent', 'categoryOffers', 'seo', 'images'],
      });

      return successResponse(
        fullResult ? this.presentCategory(fullResult) : fullResult,
        'Category created',
        201,
      );
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
        .leftJoinAndSelect('category.images', 'images')
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
      return successResponse(
        { rows: rows.map((row) => this.presentCategory(row)), count },
        'Categories fetched',
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'categoryOffers', 'seo', 'images'],
      });
      if (!category) throw new NotFoundException('Category not found');
      return successResponse(this.presentCategory(category), 'Category fetched');
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
        relations: ['categoryOffers', 'seo', 'images'],
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

      await this.upsertCategoryMedia(id, {
        image,
        image3d,
        video,
        imageAltText,
      });

      const fullResult = await this.categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'categoryOffers', 'seo', 'images'],
      });

      return successResponse(
        fullResult ? this.presentCategory(fullResult) : fullResult,
        'Category updated',
      );
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
        relations: ['images'],
        order: { id: 'ASC' },
      });
      return successResponse(
        category.map((row) => this.presentCategory(row)),
        'Categories fetched',
      );
    }

    const category = await this.categoryRepo.find({
      where: { parent: { id: parentId } },
      relations: ['images'],
      order: { id: 'ASC' },
    });
    return successResponse(
      category.map((row) => this.presentCategory(row)),
      'Categories fetched',
    );
  }
}
