// cms-section.service.ts

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { CmsSection } from '../entities/CMS/cmsSettings.entity';

import {
  CreateCmsSectionDto,
  ReorderCmsDto,
  UpdateCmsSectionDto,
} from '../dto/cms-section.dto';

import { Product } from '../entities/product/product.entity';
import { Category } from '../entities/productCategory/category.entity';
import { BlogPost } from '../entities/blog/blog-posts.entity';
import { Offer } from '../entities/product/offer.entity';
import { Faq } from '../entities/product/faq.entity';
import { Banner } from '../entities/CMS/banner.entity';

import { successResponse } from 'src/commonServices/response.service';
import { Review } from 'src/entities/product/review.entity';

@Injectable()
export class CmsSectionService implements OnModuleInit {
  constructor(
    @InjectRepository(CmsSection)
    private readonly cmsRepo: Repository<CmsSection>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(BlogPost)
    private readonly blogRepo: Repository<BlogPost>,

    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,

    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,

    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,

    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async onModuleInit() {
    await this.backfillProductSectionLinks();
    await this.removeDeprecatedSectionDataFields();
    await this.backfillMissingSlugs();
  }

  /**
   * Copy legacy product.sectionId rows into cms_section_products so existing
   * homepage links survive the ManyToMany migration.
   */
  private async backfillProductSectionLinks() {
    try {
      const table = await this.cmsRepo.manager.query(
        `SELECT to_regclass('public.cms_section_products') AS name`,
      );
      if (!table?.[0]?.name) return;

      await this.cmsRepo.manager.query(`
        INSERT INTO cms_section_products ("cmsSectionId", "productId")
        SELECT p."sectionId", p.id
        FROM product p
        INNER JOIN cms_sections s ON s.id = p."sectionId"
        WHERE p."sectionId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM cms_section_products j
            WHERE j."cmsSectionId" = p."sectionId"
              AND j."productId" = p.id
          )
      `);
    } catch (error) {
      console.warn(
        '[CmsSectionService] product↔section backfill skipped:',
        (error as Error)?.message || error,
      );
    }
  }

  private slugify(text: string): string {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  private async ensureUniqueSlug(
    source: string,
    excludeId?: number,
  ): Promise<string> {
    const base = this.slugify(source) || 'section';
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing = await this.cmsRepo.findOne({
        where: { slug: candidate },
      });
      if (!existing || (excludeId != null && existing.id === excludeId)) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  private async backfillMissingSlugs() {
    const sections = await this.cmsRepo.find();
    for (const section of sections) {
      if (section.slug?.trim()) continue;
      section.slug = await this.ensureUniqueSlug(
        section.title || `section-${section.id}`,
        section.id,
      );
      await this.cmsRepo.save(section);
    }
  }

  private sanitizeSectionData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const { backgroundColor: _backgroundColor, ...rest } = data;
    return rest;
  }

  private async removeDeprecatedSectionDataFields() {
    const sections = await this.cmsRepo.find();

    for (const section of sections) {
      if (section.data?.backgroundColor !== undefined) {
        section.data = this.sanitizeSectionData(section.data);
        await this.cmsRepo.save(section);
      }
    }
  }

  /**
   * Products ↔ sections are ManyToMany. Replacing this section's product list
   * must NOT clear the same product from other sections.
   */
  private async syncProductSectionRelation(
    sectionId: number,
    ids: number[] | undefined,
  ) {
    if (ids === undefined) return;

    const section = await this.cmsRepo.findOne({
      where: { id: sectionId },
      relations: ['products'],
    });
    if (!section) return;

    const uniqueIds = [
      ...new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ];

    section.products = uniqueIds.length
      ? await this.productRepo.findBy({ id: In(uniqueIds) })
      : [];

    await this.cmsRepo.save(section);
  }

  /**
   * Category/Blog/etc. still own a single FK (`sectionId`). Sync the owning
   * side explicitly so admin layout selections stick.
   */
  private async syncOwnedSectionRelation<T extends { id: number }>(
    repo: Repository<T>,
    sectionId: number,
    ids: number[] | undefined,
  ) {
    if (ids === undefined) return;

    const uniqueIds = [
      ...new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ];

    await repo
      .createQueryBuilder()
      .update()
      .set({ section: null } as any)
      .where('sectionId = :sectionId', { sectionId })
      .execute();

    if (!uniqueIds.length) return;

    await repo
      .createQueryBuilder()
      .update()
      .set({ section: { id: sectionId } } as any)
      .where('id IN (:...ids)', { ids: uniqueIds })
      .execute();
  }

  private async syncSectionRelations(
    sectionId: number,
    dto: {
      productIds?: number[];
      categoryIds?: number[];
      blogIds?: number[];
      offerIds?: number[];
      faqIds?: number[];
      bannerIds?: number[];
      reviewIds?: number[];
    },
  ) {
    await Promise.all([
      this.syncProductSectionRelation(sectionId, dto.productIds),
      this.syncOwnedSectionRelation(
        this.categoryRepo,
        sectionId,
        dto.categoryIds,
      ),
      this.syncOwnedSectionRelation(this.blogRepo, sectionId, dto.blogIds),
      this.syncOwnedSectionRelation(this.offerRepo, sectionId, dto.offerIds),
      this.syncOwnedSectionRelation(this.faqRepo, sectionId, dto.faqIds),
      this.syncOwnedSectionRelation(this.bannerRepo, sectionId, dto.bannerIds),
      this.syncOwnedSectionRelation(
        this.reviewRepo,
        sectionId,
        dto.reviewIds,
      ),
    ]);
  }

  /*
      CREATE
    */
  async create(createCmsSectionDto: CreateCmsSectionDto) {
    try {
      const slug = await this.ensureUniqueSlug(
        createCmsSectionDto.slug || createCmsSectionDto.title,
      );

      const {
        productIds,
        categoryIds,
        blogIds,
        offerIds,
        faqIds,
        bannerIds,
        reviewIds,
        ...sectionFields
      } = createCmsSectionDto;

      const cmsSection = this.cmsRepo.create({
        title: sectionFields.title,
        slug,
        type: sectionFields.type,
        position: sectionFields.position,
        status: sectionFields.status,
        data: this.sanitizeSectionData(sectionFields.data),
      });

      const cms = await this.cmsRepo.save(cmsSection);

      await this.syncSectionRelations(cms.id, {
        productIds,
        categoryIds,
        blogIds,
        offerIds,
        faqIds,
        bannerIds,
        reviewIds,
      });

      return this.findOne(cms.id);
    } catch (error) {
      throw error;
    }
  }

  /*
      GET ALL
    */
  async findAll() {
    try {
      const cmsSections = await this.cmsRepo.find({
        order: {
          position: 'ASC',
        },
      });

      return successResponse(
        cmsSections,
        'CMS sections retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  /*
      GET SINGLE
    */
  async findOne(id: number) {
    try {
      const cmsSection = await this.cmsRepo.findOne({
        where: { id },
        relations: [
          'products',
          'categories',
          'blogs',
          'offers',
          'faqs',
          'banners',
          'reviews',
        ],
      });

      if (!cmsSection) {
        throw new NotFoundException('CMS section not found');
      }

      return successResponse(cmsSection, 'CMS section retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  /*
      UPDATE
    */
  async update(id: number, updateCmsSectionDto: UpdateCmsSectionDto) {
    try {
      const cmsSection = await this.cmsRepo.findOne({
        where: { id },
      });

      if (!cmsSection) {
        throw new NotFoundException('CMS section not found');
      }

      const {
        productIds,
        categoryIds,
        blogIds,
        offerIds,
        faqIds,
        bannerIds,
        reviewIds,
        ...sectionFields
      } = updateCmsSectionDto;

      Object.assign(cmsSection, {
        ...sectionFields,
        data:
          sectionFields.data !== undefined
            ? this.sanitizeSectionData(sectionFields.data)
            : cmsSection.data,
      });

      const slugSource =
        sectionFields.slug?.trim() ||
        sectionFields.title?.trim() ||
        cmsSection.slug ||
        cmsSection.title;
      cmsSection.slug = await this.ensureUniqueSlug(slugSource, id);

      await this.cmsRepo.save(cmsSection);

      await this.syncSectionRelations(id, {
        productIds,
        categoryIds,
        blogIds,
        offerIds,
        faqIds,
        bannerIds,
        reviewIds,
      });

      return this.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  /*
      DELETE
    */
  async remove(id: number) {
    try {
      const cmsSection = await this.cmsRepo.findOne({
        where: { id },
        relations: ['products'],
      });

      if (!cmsSection) {
        throw new NotFoundException('CMS section not found');
      }

      // Clear M2M join rows for this section before delete
      cmsSection.products = [];
      await this.cmsRepo.save(cmsSection);
      await this.cmsRepo.remove(cmsSection);

      return successResponse(null, 'CMS section deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  async reorder(reorderCmsDto: ReorderCmsDto) {
    try {
      for (const item of reorderCmsDto.sections) {
        await this.cmsRepo.update(item.id, {
          position: item.position,
        });
      }

      return successResponse(null, 'CMS sections reordered successfully');
    } catch (error) {
      throw error;
    }
  }
}
