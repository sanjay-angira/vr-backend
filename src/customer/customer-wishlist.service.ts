import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { OfferPricingService } from 'src/commonServices/offer-pricing.service';
import { pickOptimizedImageUrl } from 'src/commonServices/image-url.util';
import { productImageSource } from 'src/commonServices/image-relation.util';
import { WishlistItem } from 'src/entities/wishlist/wishlist-item.entity';
import { User } from 'src/entities/user/user.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { WishlistMutationDto } from 'src/dto/wishlist.dto';

@Injectable()
export class CustomerWishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ProductVariant)
    private readonly variationRepository: Repository<ProductVariant>,
    private readonly offerPricingService: OfferPricingService,
  ) {}

  private parseUserId(userId: number) {
    if (!userId || Number.isNaN(userId)) {
      return null;
    }
    return userId;
  }

  private resolvePrimaryImage(variant: ProductVariant | null): string | null {
    const primary = this.resolvePrimaryImageAsset(variant);
    if (!primary) return null;
    return pickOptimizedImageUrl(productImageSource(primary), 400) || null;
  }

  private resolvePrimaryImageAsset(
    variant: ProductVariant | null,
  ): import('src/entities/product/product-images.entity').ProductImage | import('src/entities/product/variant-image.entity').VariantImage | null {
    if (variant?.images?.length) {
      return (
        [...variant.images].sort((a, b) => a.sortOrder - b.sortOrder)[0] || null
      );
    }

    if (variant?.product?.images?.length) {
      return (
        [...variant.product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0] ||
        null
      );
    }

    return null;
  }

  private async mapWishlistItem(item: WishlistItem) {
    const variant = item.variant;
    const product = variant?.product || null;

    let category: Category | null = product?.category || null;
    if (product?.category?.id) {
      category =
        (await this.offerPricingService.loadCompleteCategoryHierarchy(
          product.category.id,
          new Set(),
        )) || null;
    }

    const pricing =
      variant && product
        ? this.offerPricingService.buildVariantPricing(
            variant,
            product,
            category,
          )
        : null;

    const listPrice = Number(variant?.price ?? 0);
    const finalPrice =
      pricing?.finalPrice != null && Number.isFinite(pricing.finalPrice)
        ? Number(pricing.finalPrice)
        : listPrice;
    const stock = Number(variant?.stock ?? 0);

    return {
      id: item.id,
      userId: item.userId,
      variationId: item.variationId,
      productId: product?.id ?? null,
      productName: product?.productName || 'Unknown Product',
      productSlug: product?.productSlug || null,
      variantName: variant?.name || null,
      image: this.resolvePrimaryImage(variant),
      sellingPrice: pricing?.sellingPrice ?? listPrice,
      finalPrice,
      totalDiscount: pricing?.totalDiscount ?? 0,
      stock,
      inStock: stock > 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async loadItemsWithRelations(userId: number) {
    return this.wishlistRepository.find({
      where: { userId },
      relations: [
        'variant',
        'variant.images',
        'variant.product',
        'variant.product.images',
        'variant.product.productOffers',
        'variant.product.brand',
        'variant.product.brand.brandOffers',
        'variant.product.category',
        'variant.productVariantOffers',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async listWishlist(userId: number) {
    const parsed = this.parseUserId(userId);
    if (!parsed) {
      return errorResponse('userId is required', 400);
    }

    const rows = await this.loadItemsWithRelations(parsed);
    const items: Awaited<ReturnType<CustomerWishlistService['mapWishlistItem']>>[] =
      [];
    for (const row of rows) {
      items.push(await this.mapWishlistItem(row));
    }

    return successResponse(items, 'Wishlist fetched successfully');
  }

  async listWishlistIds(userId: number) {
    const parsed = this.parseUserId(userId);
    if (!parsed) {
      return errorResponse('userId is required', 400);
    }

    const rows = await this.wishlistRepository.find({
      where: { userId: parsed },
      select: ['variationId'],
    });

    return successResponse(
      rows.map((row) => row.variationId),
      'Wishlist ids fetched successfully',
    );
  }

  async addToWishlist(dto: WishlistMutationDto) {
    const userId = this.parseUserId(dto.userId);
    const variationId = Number(dto.variationId);

    if (!userId) {
      return errorResponse('userId is required', 400);
    }
    if (!variationId || Number.isNaN(variationId)) {
      return errorResponse('variationId is required', 400);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const variant = await this.variationRepository.findOne({
      where: { id: variationId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, variationId },
      relations: [
        'variant',
        'variant.images',
        'variant.product',
        'variant.product.images',
        'variant.product.productOffers',
        'variant.product.brand',
        'variant.product.brand.brandOffers',
        'variant.product.category',
        'variant.productVariantOffers',
      ],
    });

    if (existing) {
      return successResponse(
        await this.mapWishlistItem(existing),
        'Already in wishlist',
      );
    }

    const saved = await this.wishlistRepository.save(
      this.wishlistRepository.create({ userId, variationId }),
    );

    const hydrated = await this.wishlistRepository.findOne({
      where: { id: saved.id },
      relations: [
        'variant',
        'variant.images',
        'variant.product',
        'variant.product.images',
        'variant.product.productOffers',
        'variant.product.brand',
        'variant.product.brand.brandOffers',
        'variant.product.category',
        'variant.productVariantOffers',
      ],
    });

    return successResponse(
      await this.mapWishlistItem(hydrated!),
      'Added to wishlist',
    );
  }

  async toggleWishlist(dto: WishlistMutationDto) {
    const userId = this.parseUserId(dto.userId);
    const variationId = Number(dto.variationId);

    if (!userId) {
      return errorResponse('userId is required', 400);
    }
    if (!variationId || Number.isNaN(variationId)) {
      return errorResponse('variationId is required', 400);
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, variationId },
    });

    if (existing) {
      await this.wishlistRepository.remove(existing);
      return successResponse(
        { wished: false, variationId, id: null },
        'Removed from wishlist',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const variant = await this.variationRepository.findOne({
      where: { id: variationId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const saved = await this.wishlistRepository.save(
      this.wishlistRepository.create({ userId, variationId }),
    );

    return successResponse(
      { wished: true, variationId, id: saved.id },
      'Added to wishlist',
    );
  }

  async removeWishlistItem(id: number, userId: number) {
    const parsedUserId = this.parseUserId(userId);
    if (!parsedUserId) {
      return errorResponse('userId is required', 400);
    }
    if (!id || Number.isNaN(id)) {
      return errorResponse('Wishlist item id is required', 400);
    }

    const item = await this.wishlistRepository.findOne({
      where: { id, userId: parsedUserId },
    });
    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    const variationId = item.variationId;
    await this.wishlistRepository.remove(item);

    return successResponse(
      { id, variationId },
      'Removed from wishlist',
    );
  }

  async removeByVariation(variationId: number, userId: number) {
    const parsedUserId = this.parseUserId(userId);
    if (!parsedUserId) {
      return errorResponse('userId is required', 400);
    }
    if (!variationId || Number.isNaN(variationId)) {
      throw new BadRequestException('variationId is required');
    }

    const item = await this.wishlistRepository.findOne({
      where: { userId: parsedUserId, variationId },
    });
    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.remove(item);
    return successResponse(
      { id: item.id, variationId },
      'Removed from wishlist',
    );
  }

  async getWishlistCount(userId: number) {
    const parsed = this.parseUserId(userId);
    if (!parsed) {
      return errorResponse('userId is required', 400);
    }

    const count = await this.wishlistRepository.count({
      where: { userId: parsed },
    });

    return successResponse({ count }, 'Wishlist count fetched successfully');
  }

  /** Bulk helper kept for potential future guest-merge use. */
  async findVariationIds(userId: number, variationIds: number[]) {
    if (!variationIds.length) return [];
    const rows = await this.wishlistRepository.find({
      where: { userId, variationId: In(variationIds) },
      select: ['variationId'],
    });
    return rows.map((row) => row.variationId);
  }
}
