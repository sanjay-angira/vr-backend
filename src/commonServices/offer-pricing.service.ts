import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/productCategory/category.entity';
import { Offer, DiscountType } from 'src/entities/product/offer.entity';
import { Product } from 'src/entities/product/product.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';

export type OfferPricingResult = {
  originalPrice: number | null;
  finalPrice: number | null;
  discountAmount: number;
  discountPercentage: number;
  appliedOffer: {
    id: number;
    offerName: string;
    offerSlug: string;
    discountType: DiscountType;
    discountValue: number;
  } | null;
};

export type BestVariantResult = {
  variant: ProductVariant;
  pricing: OfferPricingResult;
};

export type AvailableOfferView = {
  id: number;
  offerName: string;
  offerSlug: string;
  discountType: DiscountType;
  discountValue: number;
  sources: Array<'product' | 'variant' | 'category' | 'brand'>;
  sellingPrice: number | null;
  finalPrice: number | null;
  totalDiscount: number;
  isApplied: boolean;
};

export type AppliedOfferView = {
  id: number;
  offerName: string;
  offerSlug: string;
  discountType: DiscountType;
  discountValue: number;
  sources: Array<'product' | 'variant' | 'category' | 'brand'>;
};

type BestAppliedOfferResult = AppliedOfferView & {
  finalPrice: number;
  totalDiscount: number;
};

export type VariantPricingView = {
  sellingPrice: number | null;
  finalPrice: number | null;
  totalDiscount: number;
  appliedOffer: AppliedOfferView | null;
  availableOffers: AvailableOfferView[];
};

@Injectable()
export class OfferPricingService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async loadCompleteCategoryHierarchy(
    categoryId: number,
    visited: Set<number> = new Set(),
  ): Promise<Category | null> {
    if (visited.has(categoryId)) {
      return null;
    }

    visited.add(categoryId);

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['parent', 'categoryOffers'],
    });

    if (category?.parent?.id && !visited.has(category.parent.id)) {
      const parent = await this.loadCompleteCategoryHierarchy(
        category.parent.id,
        visited,
      );
      category.parent = parent as Category;
    }

    return category;
  }

  getMergedActiveOffers({
    productOffers = [],
    variantOffers = [],
    brandOffers = [],
    category = null,
  }: {
    productOffers?: Offer[];
    variantOffers?: Offer[];
    brandOffers?: Offer[];
    category?: Category | null;
  }) {
    const merged = new Map<number, { offer: Offer; sources: string[] }>();

    this.addOffersToMergedMap(merged, productOffers, 'product');
    this.addOffersToMergedMap(merged, variantOffers, 'variant');
    this.addOffersToMergedMap(merged, brandOffers, 'brand');

    let currentCategory: Category | null = category;
    while (currentCategory) {
      this.addOffersToMergedMap(
        merged,
        currentCategory.categoryOffers || [],
        'category',
      );
      currentCategory = currentCategory.parent || null;
    }

    return Array.from(merged.values());
  }

  calculateOfferPricing(
    rawPrice: number | string | null | undefined,
    offers: Offer[],
  ): OfferPricingResult {
    const originalPrice = Number(rawPrice);

    if (
      !Number.isFinite(originalPrice) ||
      originalPrice <= 0 ||
      !offers.length
    ) {
      return {
        originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
        finalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
        discountAmount: 0,
        discountPercentage: 0,
        appliedOffer: null,
      };
    }

    const bestOffer = this.pickBestOfferFromList(
      originalPrice,
      offers.map((offer) => ({
        offer,
        sources: [] as AppliedOfferView['sources'],
      })),
    );

    if (!bestOffer) {
      return {
        originalPrice,
        finalPrice: originalPrice,
        discountAmount: 0,
        discountPercentage: 0,
        appliedOffer: null,
      };
    }

    const discountAmount = bestOffer.totalDiscount;
    const discountPercentage =
      originalPrice > 0
        ? Number(((discountAmount / originalPrice) * 100).toFixed(2))
        : 0;

    return {
      originalPrice,
      finalPrice: bestOffer.finalPrice,
      discountAmount,
      discountPercentage,
      appliedOffer: {
        id: bestOffer.id,
        offerName: bestOffer.offerName,
        offerSlug: bestOffer.offerSlug,
        discountType: bestOffer.discountType,
        discountValue: bestOffer.discountValue,
      },
    };
  }

  getVariantPricing(
    variant: ProductVariant,
    product: Product,
    category: Category | null,
  ): OfferPricingResult {
    const mergedActiveOffers = this.getMergedActiveOffers({
      productOffers: product.productOffers || [],
      variantOffers: variant.productVariantOffers || [],
      brandOffers: product.brand?.brandOffers || [],
      category,
    });

    return this.calculateOfferPricing(
      variant.price as number | string | null | undefined,
      mergedActiveOffers.map((entry) => entry.offer),
    );
  }

  buildVariantPricing(
    variant: ProductVariant,
    product: Product,
    category: Category | null,
  ): VariantPricingView {
    const sellingPrice = Number(variant.price);
    const hasValidSellingPrice =
      Number.isFinite(sellingPrice) && sellingPrice > 0;

    const mergedActiveOffers = this.getMergedActiveOffers({
      productOffers: product.productOffers || [],
      variantOffers: variant.productVariantOffers || [],
      brandOffers: product.brand?.brandOffers || [],
      category,
    });

    const calculatedOffers = mergedActiveOffers.map((entry) => {
      const calculated = this.calculatePriceForOffer(
        variant.price,
        entry.offer,
      );

      return {
        id: entry.offer.id,
        offerName: entry.offer.offerName,
        offerSlug: entry.offer.offerSlug,
        discountType: entry.offer.discountType,
        discountValue: Number(entry.offer.discountValue),
        sources: entry.sources as AvailableOfferView['sources'],
        sellingPrice: calculated.originalPrice,
        finalPrice: calculated.finalPrice,
        totalDiscount: calculated.discountAmount,
      };
    });

    const bestOffer = hasValidSellingPrice
      ? this.pickBestOfferFromList(
          sellingPrice,
          mergedActiveOffers as Array<{
            offer: Offer;
            sources: AppliedOfferView['sources'];
          }>,
        )
      : null;

    const availableOffers: AvailableOfferView[] = calculatedOffers
      .sort((left, right) => this.compareOfferCandidates(left, right))
      .map((offer) => ({
        ...offer,
        isApplied: bestOffer !== null && offer.id === bestOffer.id,
      }));

    return {
      sellingPrice: hasValidSellingPrice ? sellingPrice : null,
      finalPrice:
        bestOffer?.finalPrice ?? (hasValidSellingPrice ? sellingPrice : null),
      totalDiscount: bestOffer?.totalDiscount ?? 0,
      appliedOffer: bestOffer
        ? {
            id: bestOffer.id,
            offerName: bestOffer.offerName,
            offerSlug: bestOffer.offerSlug,
            discountType: bestOffer.discountType,
            discountValue: bestOffer.discountValue,
            sources: bestOffer.sources,
          }
        : null,
      availableOffers,
    };
  }

  compareVariantsByFinalPrice(
    left: {
      id: number;
      price?: number | string | null;
      stock?: number | string | null;
      pricing: { finalPrice: number | null; sellingPrice: number | null };
    },
    right: {
      id: number;
      price?: number | string | null;
      stock?: number | string | null;
      pricing: { finalPrice: number | null; sellingPrice: number | null };
    },
  ): number {
    const leftInStock = Number(left.stock) > 0;
    const rightInStock = Number(right.stock) > 0;
    if (leftInStock && !rightInStock) return -1;
    if (!leftInStock && rightInStock) return 1;

    const leftPrice =
      left.pricing.finalPrice ??
      left.pricing.sellingPrice ??
      (Number.isFinite(Number(left.price))
        ? Number(left.price)
        : Number.POSITIVE_INFINITY);
    const rightPrice =
      right.pricing.finalPrice ??
      right.pricing.sellingPrice ??
      (Number.isFinite(Number(right.price))
        ? Number(right.price)
        : Number.POSITIVE_INFINITY);

    if (leftPrice !== rightPrice) {
      return leftPrice - rightPrice;
    }

    const leftOriginal = Number(left.price) || 0;
    const rightOriginal = Number(right.price) || 0;
    if (leftOriginal !== rightOriginal) {
      return leftOriginal - rightOriginal;
    }

    return left.id - right.id;
  }

  /**
   * Prefer the lowest-priced **in-stock** variant (after offers).
   * Only falls back to an out-of-stock variant when no in-stock option exists.
   * Ranking matches product-detail sort (`compareVariantsByFinalPrice`).
   */
  findBestVariant(
    product: Product,
    category: Category | null,
  ): BestVariantResult | null {
    const variants = product.variants || [];
    if (!variants.length) {
      return null;
    }

    const candidates: BestVariantResult[] = [];

    for (const variant of variants) {
      const pricing = this.getVariantPricing(variant, product, category);
      const finalPrice =
        pricing.finalPrice ??
        (Number.isFinite(Number(variant.price)) ? Number(variant.price) : null);

      if (finalPrice === null) {
        continue;
      }

      candidates.push({ variant, pricing });
    }

    if (!candidates.length) {
      return null;
    }

    const inStockCandidates = candidates.filter(
      (entry) => Number(entry.variant.stock) > 0,
    );
    // Never prefer OOS when an in-stock variant exists
    const pool = inStockCandidates.length > 0 ? inStockCandidates : candidates;

    pool.sort((left, right) =>
      this.compareVariantsByFinalPrice(
        {
          id: left.variant.id,
          price: left.variant.price,
          stock: left.variant.stock,
          pricing: {
            finalPrice: left.pricing.finalPrice,
            sellingPrice: left.pricing.originalPrice,
          },
        },
        {
          id: right.variant.id,
          price: right.variant.price,
          stock: right.variant.stock,
          pricing: {
            finalPrice: right.pricing.finalPrice,
            sellingPrice: right.pricing.originalPrice,
          },
        },
      ),
    );

    return pool[0];
  }

  private pickBestOfferFromList(
    sellingPrice: number,
    mergedActiveOffers: Array<{
      offer: Offer;
      sources: AppliedOfferView['sources'];
    }>,
  ): BestAppliedOfferResult | null {
    if (!mergedActiveOffers.length) {
      return null;
    }

    let bestCandidate: {
      id: number;
      offerName: string;
      offerSlug: string;
      discountType: DiscountType;
      discountValue: number;
      sources: AppliedOfferView['sources'];
      finalPrice: number;
      totalDiscount: number;
    } | null = null;

    for (const entry of mergedActiveOffers) {
      const calculated = this.calculatePriceForOffer(sellingPrice, entry.offer);
      const finalPrice = calculated.finalPrice;

      if (finalPrice === null || finalPrice >= sellingPrice) {
        continue;
      }

      const candidate = {
        id: entry.offer.id,
        offerName: entry.offer.offerName,
        offerSlug: entry.offer.offerSlug,
        discountType: entry.offer.discountType,
        discountValue: Number(entry.offer.discountValue),
        sources: entry.sources,
        finalPrice,
        totalDiscount: calculated.discountAmount,
      };

      if (!bestCandidate) {
        bestCandidate = candidate;
        continue;
      }

      if (this.compareOfferCandidates(candidate, bestCandidate) < 0) {
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) {
      return null;
    }

    return {
      id: bestCandidate.id,
      offerName: bestCandidate.offerName,
      offerSlug: bestCandidate.offerSlug,
      discountType: bestCandidate.discountType,
      discountValue: bestCandidate.discountValue,
      sources: bestCandidate.sources,
      finalPrice: bestCandidate.finalPrice,
      totalDiscount: bestCandidate.totalDiscount,
    };
  }

  private compareOfferCandidates(
    left: { id: number; finalPrice: number | null; totalDiscount: number },
    right: { id: number; finalPrice: number | null; totalDiscount: number },
  ): number {
    const leftPrice = left.finalPrice ?? Number.POSITIVE_INFINITY;
    const rightPrice = right.finalPrice ?? Number.POSITIVE_INFINITY;

    if (leftPrice !== rightPrice) {
      return leftPrice - rightPrice;
    }

    if (left.totalDiscount !== right.totalDiscount) {
      return right.totalDiscount - left.totalDiscount;
    }

    return left.id - right.id;
  }

  private addOffersToMergedMap(
    merged: Map<number, { offer: Offer; sources: string[] }>,
    offers: Offer[],
    source: 'product' | 'variant' | 'category' | 'brand',
  ) {
    for (const offer of offers || []) {
      if (!this.isOfferApplicable(offer)) {
        continue;
      }

      const existing = merged.get(offer.id);
      if (existing) {
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
      } else {
        merged.set(offer.id, {
          offer,
          sources: [source],
        });
      }
    }
  }

  private isOfferApplicable(offer: Offer): boolean {
    if (!offer?.isActive) {
      return false;
    }

    if (!offer.timeBased) {
      return true;
    }

    const now = new Date();
    const startDate = offer.startDate ? new Date(offer.startDate) : null;
    const endDate = offer.endDate ? new Date(offer.endDate) : null;

    if (startDate && now < startDate) {
      return false;
    }

    if (endDate && now > endDate) {
      return false;
    }

    return true;
  }

  calculatePriceForOffer(
    rawPrice: number | string | null | undefined,
    offer: Offer,
  ) {
    const originalPrice = Number(rawPrice);

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      return {
        offerId: offer.id,
        offerName: offer.offerName,
        offerSlug: offer.offerSlug,
        discountType: offer.discountType,
        discountValue: Number(offer.discountValue),
        originalPrice: null,
        finalPrice: null,
        discountAmount: 0,
        discountPercentage: 0,
      };
    }

    let discountedPrice = originalPrice;

    if (offer.discountType === DiscountType.PERCENTAGE) {
      discountedPrice =
        originalPrice - (originalPrice * Number(offer.discountValue)) / 100;
    } else if (offer.discountType === DiscountType.FIXED) {
      discountedPrice = originalPrice - Number(offer.discountValue);
    }

    discountedPrice = Math.max(0, Number(discountedPrice.toFixed(2)));
    const discountAmount = Number((originalPrice - discountedPrice).toFixed(2));
    const discountPercentage =
      originalPrice > 0
        ? Number(((discountAmount / originalPrice) * 100).toFixed(2))
        : 0;

    return {
      offerId: offer.id,
      offerName: offer.offerName,
      offerSlug: offer.offerSlug,
      discountType: offer.discountType,
      discountValue: Number(offer.discountValue),
      originalPrice,
      finalPrice: discountedPrice,
      discountAmount,
      discountPercentage,
    };
  }
}
