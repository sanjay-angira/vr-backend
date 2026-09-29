import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { CategorySeo } from '../entities/productCategory/category-seo.entity';
import { Product } from '../entities/product/product.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import { successResponse } from 'src/commonServices/response.service';
import { IdDto, PaginationDto } from 'src/dto/common.dto';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';
import { Offer } from 'src/entities/product/offer.entity';

/** FKs to `product` without ON DELETE CASCADE in the DB: [table, column]. */
const PRODUCT_NO_CASCADE_REFERENCES: ReadonlyArray<[string, string]> = [
  ['cms_section_products', 'productId'],
  ['product_frequently_bought_together_product', 'productId_2'],
  ['product_frequently_bought', 'related_product_id'],
];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(CategorySeo)
    private readonly categorySeoRepo: Repository<CategorySeo>,
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
      mobileImage,
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
        mobileImage: mobileImage ?? null,
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
      mobileImage,
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
      if (showOnHomePage !== undefined)
        category.showOnHomePage = showOnHomePage;
      if (image !== undefined) category.image = image;
      if (imageAltText !== undefined) category.imageAltText = imageAltText;
      if (mobileImage !== undefined) category.mobileImage = mobileImage;

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
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) throw new NotFoundException('Category not found');

      const { categoryCount, productCount } =
        await this.categoryRepo.manager.transaction(async (manager) => {
          const levels = await this.collectCategoryLevels(manager, id);
          const categoryIds = levels.flat();

          const productRows: { id: number }[] = await manager
            .createQueryBuilder(Product, 'product')
            .select('product.id', 'id')
            .where('"product"."categoryId" IN (:...categoryIds)', {
              categoryIds,
            })
            .getRawMany();
          const productIds = productRows.map((row) => Number(row.id));

          if (productIds.length > 0) {
            for (const [table, column] of PRODUCT_NO_CASCADE_REFERENCES) {
              await this.deleteRowsReferencing(
                manager,
                table,
                column,
                productIds,
              );
            }

            await manager
              .createQueryBuilder()
              .delete()
              .from(Product)
              .whereInIds(productIds)
              .execute();
          }

          await manager
            .createQueryBuilder()
            .delete()
            .from(CategorySeo)
            .where('"categoryId" IN (:...categoryIds)', { categoryIds })
            .execute();

          // Children reference parents without ON DELETE CASCADE, so delete
          // the deepest level first.
          for (const levelIds of [...levels].reverse()) {
            await manager
              .createQueryBuilder()
              .delete()
              .from(Category)
              .whereInIds(levelIds)
              .execute();
          }

          return {
            categoryCount: categoryIds.length,
            productCount: productIds.length,
          };
        });

      const subcategoryCount = categoryCount - 1;
      return successResponse(
        {
          deleted: true,
          deletedSubcategories: subcategoryCount,
          deletedProducts: productCount,
        },
        `Category deleted along with ${subcategoryCount} subcategor${subcategoryCount === 1 ? 'y' : 'ies'} and ${productCount} product(s)`,
      );
    } catch (error) {
      throw error;
    }
  }

  /** Skips tables that don't exist (legacy tables may be absent in some environments). */
  private async deleteRowsReferencing(
    manager: EntityManager,
    table: string,
    column: string,
    ids: number[],
  ): Promise<void> {
    const [{ exists }] = await manager.query(
      `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
      [`public.${table}`],
    );
    if (!exists) return;

    await manager.query(
      `DELETE FROM "public"."${table}" WHERE "${column}" = ANY($1::int[])`,
      [ids],
    );
  }

  /** Returns category ids grouped by depth: [[rootId], [children], [grandchildren], ...]. */
  private async collectCategoryLevels(
    manager: EntityManager,
    rootId: number,
  ): Promise<number[][]> {
    const levels: number[][] = [[rootId]];
    const seen = new Set<number>([rootId]);
    let current = [rootId];

    while (current.length > 0) {
      const children: { id: number }[] = await manager
        .createQueryBuilder(Category, 'category')
        .select('category.id', 'id')
        .where('"category"."parentId" IN (:...parentIds)', {
          parentIds: current,
        })
        .getRawMany();

      const next = children
        .map((row) => Number(row.id))
        .filter((childId) => !seen.has(childId));
      next.forEach((childId) => seen.add(childId));

      if (next.length > 0) levels.push(next);
      current = next;
    }

    return levels;
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
