import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { OfferPricingService } from 'src/commonServices/offer-pricing.service';
import { pickProductOrVariantCardImage } from 'src/commonServices/image-relation.util';
import { RecentlyViewed } from 'src/entities/recently-viewed/recently-viewed.entity';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { AddRecentlyViewedDto } from 'src/dto/recently-viewed.dto';

const MAX_RECENTLY_VIEWED = 40;
const DEFAULT_LIST_LIMIT = 20;

@Injectable()
export class CustomerRecentlyViewedService {
  constructor(
    @InjectRepository(RecentlyViewed)
    private readonly recentlyViewedRepository: Repository<RecentlyViewed>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly offerPricingService: OfferPricingService,
  ) {}

  private parseUserId(userId?: number | string | null): number | null {
    if (userId == null || userId === '' || userId === 'null') return null;
    const parsed = Number(userId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private parseSessionId(sessionId?: string | null): string | null {
    if (
      sessionId == null ||
      sessionId === '' ||
      sessionId === 'null' ||
      sessionId === 'undefined'
    ) {
      return null;
    }
    return String(sessionId).trim() || null;
  }

  private cleanProductIds(productIds: unknown): number[] {
    if (!Array.isArray(productIds)) return [];
    return [
      ...new Set(
        productIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ];
  }

  /**
   * Attach guest session views to the logged-in user (same idea as cart merge).
   */
  async mergeGuestViewsIntoUser(userId: number, sessionId: string) {
    const sessionViews = await this.recentlyViewedRepository.find({
      where: { sessionId, userId: IsNull() },
    });

    for (const view of sessionViews) {
      const existingForUser = await this.recentlyViewedRepository.findOne({
        where: { userId, productId: view.productId },
      });

      if (existingForUser) {
        existingForUser.updatedAt = new Date();
        if (!existingForUser.sessionId) {
          existingForUser.sessionId = sessionId;
        }
        await this.recentlyViewedRepository.save(existingForUser);
        await this.recentlyViewedRepository.remove(view);
      } else {
        view.userId = userId;
        await this.recentlyViewedRepository.save(view);
      }
    }
  }

  private async findExistingEntry(
    productId: number,
    userId: number | null,
    sessionId: string | null,
  ) {
    if (userId) {
      return this.recentlyViewedRepository.findOne({
        where: { userId, productId },
      });
    }
    if (sessionId) {
      return this.recentlyViewedRepository.findOne({
        where: { sessionId, productId, userId: IsNull() },
      });
    }
    return null;
  }

  private async trimOldest(userId: number | null, sessionId: string | null) {
    const where = userId
      ? { userId }
      : sessionId
        ? { sessionId, userId: IsNull() }
        : null;
    if (!where) return;

    const rows = await this.recentlyViewedRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });

    if (rows.length <= MAX_RECENTLY_VIEWED) return;

    const toRemove = rows.slice(MAX_RECENTLY_VIEWED);
    await this.recentlyViewedRepository.remove(toRemove);
  }

  async addRecentlyViewed(dto: AddRecentlyViewedDto) {
    const userId = this.parseUserId(dto.userId);
    const sessionId = this.parseSessionId(dto.sessionId);
    const productIds = this.cleanProductIds(dto.productIds);

    if (!userId && !sessionId) {
      return errorResponse('userId or sessionId is required', 400);
    }
    if (productIds.length === 0) {
      return errorResponse('productIds is required', 400);
    }

    if (userId && sessionId) {
      await this.mergeGuestViewsIntoUser(userId, sessionId);
    }

    const existingProducts = await this.productRepository.find({
      where: {
        id: In(productIds),
        isActive: true,
        publishStatus: PublishStatus.PUBLISHED,
      },
      select: ['id'],
    });
    const validIds = new Set(existingProducts.map((p) => p.id));

    let addedOrUpdated = 0;

    for (const productId of productIds) {
      if (!validIds.has(productId)) continue;

      const existing = await this.findExistingEntry(
        productId,
        userId,
        sessionId,
      );

      if (existing) {
        existing.updatedAt = new Date();
        if (userId && !existing.userId) {
          existing.userId = userId;
        }
        if (sessionId && !existing.sessionId) {
          existing.sessionId = sessionId;
        }
        await this.recentlyViewedRepository.save(existing);
        addedOrUpdated += 1;
        continue;
      }

      await this.recentlyViewedRepository.save(
        this.recentlyViewedRepository.create({
          productId,
          userId,
          sessionId: userId ? sessionId : sessionId,
        }),
      );
      addedOrUpdated += 1;
    }

    await this.trimOldest(userId, sessionId);

    return successResponse(
      { addedOrUpdated },
      addedOrUpdated > 0
        ? 'Recently viewed products updated'
        : 'No new products were added',
    );
  }

  private mapProductCard(
    product: Product,
    categoryWithHierarchy: Category | null,
  ) {
    const bestVariantResult = this.offerPricingService.findBestVariant(
      product,
      categoryWithHierarchy,
    );

    if (!bestVariantResult) {
      return null;
    }

    const { variant, pricing } = bestVariantResult;
    const productImages = [...(product.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const variantImages = [...(variant.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const approvedReviews = (product.reviews || []).filter(
      (review) => review.isApproved,
    );
    const averageRating = approvedReviews.length
      ? approvedReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0,
        ) / approvedReviews.length
      : 0;

    return {
      id: String(variant.id),
      productId: product.id,
      // Canonical product path — avoid variant.slug in /product/[slug] (PDP rewrites URL).
      slug: product.productSlug,
      variantSlug: variant.slug || null,
      name: `${product.productName || ''}${variant.name ? ` ${variant.name}` : ''}`.trim(),
      description: product.shortDescription || product.description || '',
      price: pricing.finalPrice ?? (Number(variant.price) || 0),
      originalPrice: pricing.originalPrice ?? (Number(variant.price) || 0),
      discountAmount: pricing.discountAmount,
      discountPercentage: pricing.discountPercentage,
      appliedOffer: pricing.appliedOffer,
      image: pickProductOrVariantCardImage(productImages, variantImages, 400),
      category: product.category?.categoryName || '',
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: approvedReviews.length,
      inStock: Number(variant.stock) > 0,
    };
  }

  async listRecentlyViewed(
    userIdRaw?: string | number | null,
    sessionIdRaw?: string | null,
    limitRaw?: string | number | null,
  ) {
    const userId = this.parseUserId(userIdRaw);
    const sessionId = this.parseSessionId(sessionIdRaw);
    const limit = Math.min(
      Math.max(Number(limitRaw) || DEFAULT_LIST_LIMIT, 1),
      MAX_RECENTLY_VIEWED,
    );

    if (!userId && !sessionId) {
      return errorResponse('userId or sessionId is required', 400);
    }

    if (userId && sessionId) {
      await this.mergeGuestViewsIntoUser(userId, sessionId);
    }

    const where = userId
      ? { userId }
      : { sessionId: sessionId!, userId: IsNull() };

    const rows = await this.recentlyViewedRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    const productIds = [...new Set(rows.map((row) => row.productId))];
    if (productIds.length === 0) {
      return successResponse({ products: [], count: 0 }, 'No recently viewed products');
    }

    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
        isActive: true,
        publishStatus: PublishStatus.PUBLISHED,
      },
      relations: [
        'images',
        'variants',
        'variants.images',
        'variants.productVariantOffers',
        'productOffers',
        'brand',
        'brand.brandOffers',
        'category',
        'reviews',
      ],
      loadEagerRelations: false,
    });

    const productById = new Map(products.map((p) => [p.id, p]));
    const cards: NonNullable<
      ReturnType<CustomerRecentlyViewedService['mapProductCard']>
    >[] = [];
    const seenProductIds = new Set<number>();

    for (const row of rows) {
      if (seenProductIds.has(row.productId)) continue;

      const product = productById.get(row.productId);
      if (!product) continue;

      const categoryWithHierarchy = product.category?.id
        ? await this.offerPricingService.loadCompleteCategoryHierarchy(
            product.category.id,
            new Set(),
          )
        : null;

      const card = this.mapProductCard(product, categoryWithHierarchy);
      if (card) {
        seenProductIds.add(row.productId);
        cards.push(card);
      }
    }

    return successResponse(
      { products: cards, count: cards.length },
      'Recently viewed products fetched successfully',
    );
  }
}
