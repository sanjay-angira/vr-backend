import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { OfferPricingService } from 'src/commonServices/offer-pricing.service';
import { RazorpayService } from 'src/commonServices/razorpay.service';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { DataSource, In, ILike, Repository } from 'typeorm';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { Cart } from 'src/entities/cart/cart.entity';
import { CartItem } from 'src/entities/cart/cart-item.entity';
import { Banner } from 'src/entities/CMS/banner.entity';
import {
  CmsSection,
  CmsSectionType,
} from 'src/entities/CMS/cmsSettings.entity';
import { pickOptimizedImageUrl } from 'src/commonServices/image-url.util';
import {
  bannerImageSource,
  categoryImageAlt,
  categoryImageSource,
  pickProductCardImage,
  pickProductOrVariantCardImage,
} from 'src/commonServices/image-relation.util';
import { Order } from 'src/entities/order/order.entity';
import { OrderItem } from 'src/entities/order/order-item.entity';
import { OrderShippingAddress } from 'src/entities/order/order-shipping-address';
import { OrderItemOfferJson } from 'src/entities/order/order-item-offer-json';
import { AddToCartDto, UpdateCartDto } from 'src/dto/cart.dto';
import { CheckoutDto } from 'src/dto/checkout.dto';
import { VerifyRazorpayPaymentDto } from 'src/dto/razorpay-payment.dto';
import { StoreProductsQueryDto } from 'src/dto/store-products.dto';
import { CustomerAddressService } from './customer-address.service';
import { Coupon, DiscountType } from 'src/entities/user/coupon.entity';
import { ApplyCouponDto } from 'src/dto/coupon.dto';

type ResolvedCheckoutCoupon = {
  id: number;
  couponCode: string;
  discountType: DiscountType | string;
  discountValue: number;
  couponDiscount: number;
};

type StoreProductCard = {
  id: number;
  productId: number;
  variantId: number;
  productSlug: string | null;
  productName: string;
  baseProductName: string | null;
  variantName: string | null;
  shortDescription: string | null;
  sku: string | null;
  stock: number;
  inStock: boolean;
  image: string | null;
  images: unknown[];
  originalPrice: number | null;
  finalPrice: number | null;
  discountAmount: number;
  discountPercentage: number;
  appliedOffer: unknown;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  hasDeal: boolean;
  createdAt: Date;
  category: {
    id: number;
    categoryName: string;
    categorySlug: string;
  } | null;
  brand: {
    id: number;
    brandName: string;
    brandSlug: string;
  } | null;
};

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variationRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @InjectRepository(CmsSection)
    private readonly cmsSectionRepository: Repository<CmsSection>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    private readonly offerPricingService: OfferPricingService,
    private readonly razorpayService: RazorpayService,
    private readonly customerAddressService: CustomerAddressService,
    private readonly dataSource: DataSource,
  ) {}

  private generateOrderNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VR-${stamp}-${rand}`;
  }

  private toCouponDateKey(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
  }

  private isCouponWithinValidity(coupon: Coupon): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const start = this.toCouponDateKey(coupon.startDate);
    const end = this.toCouponDateKey(coupon.endDate);
    return start <= today && end >= today;
  }

  private isCouponUserAllowed(
    coupon: Coupon,
    userId?: number | null,
  ): boolean {
    if (!coupon.isUserSpecific) return true;
    if (!userId) return false;
    return (coupon.users || []).some(
      (user) => Number(user.id) === Number(userId),
    );
  }

  private computeCouponDiscount(
    discountType: string,
    discountValue: number,
    payableSubtotal: number,
  ): number {
    const subtotal = Math.max(0, Number(payableSubtotal) || 0);
    const value = Number(discountValue) || 0;
    const type = String(discountType || '').toLowerCase();

    if (subtotal <= 0 || value <= 0) return 0;

    if (
      type === DiscountType.PERCENTAGE ||
      type === 'percentage' ||
      type === 'percent'
    ) {
      return Math.min(subtotal, Math.round((subtotal * value) / 100));
    }

    return Math.min(subtotal, value);
  }

  async applyCoupon(dto: ApplyCouponDto) {
    const code = dto.code?.trim();
    if (!code) {
      return errorResponse('Invalid Coupon Code', 400);
    }

    const coupon = await this.couponRepository.findOne({
      where: { couponCode: ILike(code), isDeleted: false },
      relations: ['users'],
    });

    if (!coupon || !coupon.isActive) {
      return errorResponse('Invalid Coupon Code', 400);
    }

    if (!this.isCouponWithinValidity(coupon)) {
      return errorResponse('This coupon has expired', 400);
    }

    if (coupon.isUserSpecific) {
      if (!dto.userId) {
        return errorResponse('Please log in to use this coupon', 401);
      }
      if (!this.isCouponUserAllowed(coupon, dto.userId)) {
        return errorResponse('Invalid Coupon Code', 400);
      }
    }

    return successResponse(
      {
        id: coupon.id,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
      'Coupon applied successfully',
    );
  }

  private async resolveCheckoutDiscount(
    couponId: number,
    userId: number | null | undefined,
    payableSubtotal: number,
  ): Promise<ResolvedCheckoutCoupon | null> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId, isDeleted: false },
      relations: ['users'],
    });

    if (
      !coupon ||
      !coupon.isActive ||
      !this.isCouponWithinValidity(coupon)
    ) {
      return null;
    }

    if (!this.isCouponUserAllowed(coupon, userId)) {
      return null;
    }

    const discountValue = Number(coupon.discountValue);
    const type = String(coupon.discountType);

    if (
      (type === DiscountType.FIXED || type === 'fixed') &&
      discountValue > payableSubtotal
    ) {
      return null;
    }

    const couponDiscount = this.computeCouponDiscount(
      type,
      discountValue,
      payableSubtotal,
    );

    if (couponDiscount <= 0) {
      return null;
    }

    return {
      id: coupon.id,
      couponCode: coupon.couponCode,
      discountType: coupon.discountType,
      discountValue,
      couponDiscount: Number(couponDiscount.toFixed(2)),
    };
  }

  /** Load a variant with relations needed for offer pricing. */
  private async loadVariantForOfferPricing(variationId: number) {
    return this.variationRepository.findOne({
      where: { id: variationId },
      relations: [
        'productVariantOffers',
        'product',
        'product.productOffers',
        'product.brand',
        'product.brand.brandOffers',
        'product.category',
        'product.images',
        'images',
      ],
    });
  }

  /**
   * Same pricing path as product/shop pages — returns offer-aware unit price.
   */
  private async resolveOfferUnitPrice(variationId: number): Promise<{
    variation: ProductVariant;
    unitPrice: number;
    sellingPrice: number | null;
    totalDiscount: number;
    appliedOffer: {
      id: number;
      offerName: string;
      offerSlug: string;
      discountType: string;
      discountValue: number;
      sources: Array<'product' | 'variant' | 'category' | 'brand'>;
    } | null;
  }> {
    const variation = await this.loadVariantForOfferPricing(variationId);
    if (!variation?.product) {
      throw new NotFoundException('Variation not found');
    }

    const product = variation.product;
    let category: Category | null = product.category || null;
    if (product.category?.id) {
      category =
        (await this.offerPricingService.loadCompleteCategoryHierarchy(
          product.category.id,
          new Set(),
        )) || null;
    }

    const pricing = this.offerPricingService.buildVariantPricing(
      variation,
      product,
      category,
    );

    const listPrice = Number(variation.price);
    const unitPrice =
      pricing.finalPrice != null && Number.isFinite(pricing.finalPrice)
        ? Number(pricing.finalPrice)
        : Number.isFinite(listPrice)
          ? listPrice
          : 0;

    return {
      variation,
      unitPrice,
      sellingPrice: pricing.sellingPrice,
      totalDiscount: pricing.totalDiscount,
      appliedOffer: pricing.appliedOffer,
    };
  }

  private async mergeGuestCartIntoUser(userId: number, sessionId: string) {
    if (!userId || !sessionId) return;

    const guestCart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items'],
    });
    if (!guestCart?.items?.length) return;

    const userCart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!userCart) {
      guestCart.userId = userId;
      guestCart.sessionId = null as any;
      await this.cartRepository.save(guestCart);
      return;
    }

    if (guestCart.id === userCart.id) return;

    for (const guestItem of guestCart.items) {
      const existing = (userCart.items || []).find(
        (item) => item.variationId === guestItem.variationId,
      );
      if (existing) {
        existing.quantity += guestItem.quantity;
        await this.cartItemRepository.save(existing);
        await this.cartItemRepository.delete(guestItem.id);
      } else {
        guestItem.cartId = userCart.id;
        await this.cartItemRepository.save(guestItem);
      }
    }

    await this.cartRepository.delete(guestCart.id);
  }

  private slugifySectionTitle(text: string): string {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async getStoreCategories() {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :isActive', { isActive: true })
      .andWhere('category.publishStatus = :publishStatus', {
        publishStatus: 'published',
      })
      .orderBy('category.categoryName', 'ASC')
      .getMany();

    const rows = await Promise.all(
      categories.map(async (category) => {
        const productCount = await this.productRepository.count({
          where: {
            isActive: true,
            publishStatus: PublishStatus.PUBLISHED,
            category: { id: category.id },
          },
        });

        return {
          id: category.id,
          name: category.categoryName,
          slug: category.categorySlug,
          description: category.shortDescription || category.description || '',
          image: pickOptimizedImageUrl(categoryImageSource(category), 400),
          imageAlt: categoryImageAlt(category, category.categoryName),
          productCount,
          href: category.categorySlug
            ? `/products?category=${encodeURIComponent(category.categorySlug)}`
            : `/products`,
        };
      }),
    );

    return successResponse(
      { rows, count: rows.length },
      'Categories retrieved successfully',
    );
  }

  async getStoreFilters() {
    const [categories, priceBounds, banners, productSections] =
      await Promise.all([
        this.categoryRepository
          .createQueryBuilder('category')
          .leftJoinAndSelect('category.parent', 'parent')
          .where('category.isActive = :isActive', { isActive: true })
          .andWhere('category.publishStatus = :publishStatus', {
            publishStatus: 'published',
          })
          .orderBy('category.categoryName', 'ASC')
          .getMany(),
        this.variationRepository
          .createQueryBuilder('variant')
          .innerJoin('variant.product', 'product')
          .where('product.isActive = :isActive', { isActive: true })
          .andWhere('product.publishStatus = :publishStatus', {
            publishStatus: PublishStatus.PUBLISHED,
          })
          .select('MIN(variant.price)', 'minPrice')
          .addSelect('MAX(variant.price)', 'maxPrice')
          .getRawOne<{ minPrice: string | null; maxPrice: string | null }>(),
        this.bannerRepository.find({
          where: { status: true },
          order: { position: 'ASC', id: 'ASC' },
          take: 8,
        }),
        this.cmsSectionRepository.find({
          where: { status: true },
          order: { position: 'ASC', id: 'ASC' },
        }),
      ]);

    const minPrice = Math.max(
      0,
      Math.floor(Number(priceBounds?.minPrice) || 0),
    );
    const maxPrice = Math.max(
      minPrice,
      Math.ceil(Number(priceBounds?.maxPrice) || 100000),
    );

    const productLayoutTypes = new Set<string>([
      CmsSectionType.PRODUCT_SLIDER,
      CmsSectionType.CUSTOM,
    ]);

    const productSectionOptions = productSections
      .filter((section) => {
        if (!productLayoutTypes.has(section.type)) return false;
        // Product slider always listed; custom only when it has products
        if (section.type === CmsSectionType.PRODUCT_SLIDER) return true;
        return (section.products?.length || 0) > 0;
      })
      .map((section) => {
        const heading =
          typeof section.data?.heading === 'string'
            ? section.data.heading.trim()
            : '';
        const slug =
          (section.slug && String(section.slug).trim()) ||
          this.slugifySectionTitle(
            heading || section.title || `section-${section.id}`,
          );
        return {
          slug,
          title: heading || section.title,
          type: section.type,
        };
      })
      .filter((section) => Boolean(section.slug));

    return successResponse(
      {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.categoryName,
          slug: category.categorySlug,
          image: pickOptimizedImageUrl(categoryImageSource(category), 400) || null,
          parentId: category.parent?.id ?? null,
        })),
        priceRange: { min: minPrice, max: maxPrice },
        sortOptions: [
          { value: 'newest', label: 'Newest' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'name_asc', label: 'Name: A to Z' },
          { value: 'discount_desc', label: 'Best Discount' },
        ],
        statusOptions: [
          ...productSectionOptions.map((section) => ({
            value: `section:${section.slug}`,
            label: section.title,
            sectionSlug: section.slug,
          })),
        ],
        productSections: productSectionOptions,
        banners: banners.map((banner) => ({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle || '',
          image: pickOptimizedImageUrl(
            bannerImageSource(banner, 'desktop'),
            1920,
          ),
          mobileImage: pickOptimizedImageUrl(
            bannerImageSource(banner, 'mobile'),
            1200,
          ),
          link: banner.bannerLink || '/shop',
        })),
      },
      'Store filters retrieved successfully',
    );
  }

  async getStoreProducts(query: StoreProductsQueryDto) {
    const parsedPageNumber = Number(query.pageNumber);
    const parsedPageSize = Number(query.pageSize);
    const pageNumber =
      Number.isFinite(parsedPageNumber) && parsedPageNumber > 0
        ? parsedPageNumber
        : 1;
    const pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? parsedPageSize
        : 48;
    const search = query.search?.trim();
    const categoryIds = (query.categoryIds || '')
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
    const minPriceRaw = query.minPrice;
    const maxPriceRaw = query.maxPrice;
    const minPrice = Number(minPriceRaw);
    const maxPrice = Number(maxPriceRaw);
    // Only apply price filter when the client explicitly sent bounds
    const hasMinPrice =
      minPriceRaw !== undefined &&
      minPriceRaw !== null &&
      String(minPriceRaw).trim() !== '' &&
      Number.isFinite(minPrice);
    const hasMaxPrice =
      maxPriceRaw !== undefined &&
      maxPriceRaw !== null &&
      String(maxPriceRaw).trim() !== '' &&
      Number.isFinite(maxPrice);
    const sortBy = (query.sortBy || 'newest').trim().toLowerCase();
    const newArrivals = this.parseBooleanFlag(query.newArrivals);
    const featured = this.parseBooleanFlag(query.featured);
    const bestDeals = this.parseBooleanFlag(query.bestDeals);
    const sectionSlugs = (query.sectionSlugs || '')
      .split(',')
      .map((slug) => slug.trim().toLowerCase())
      .filter((slug) => Boolean(slug));

    try {
      // Step 1: collect product ids without heavy joins (avoids distinct/join drops)
      // Postgres requires ORDER BY columns to appear in SELECT when using DISTINCT
      const idQb = this.productRepository
        .createQueryBuilder('product')
        .select('product.id', 'id')
        .addSelect('product.createdAt', 'createdAt')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.publishStatus = :publishStatus', {
          publishStatus: PublishStatus.PUBLISHED,
        });

      if (search) {
        idQb.leftJoin('product.variants', 'variants').andWhere(
          `(product.productName ILIKE :search
                          OR product.productSlug ILIKE :search
                          OR variants.name ILIKE :search
                          OR variants.slug ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      if (categoryIds.length > 0) {
        idQb
          .leftJoin('product.category', 'category')
          .andWhere('category.id IN (:...categoryIds)', { categoryIds });
      }

      if (sectionSlugs.length > 0) {
        idQb
          .innerJoin('product.sections', 'cmsSection')
          .andWhere('cmsSection.slug IN (:...sectionSlugs)', { sectionSlugs })
          .andWhere('cmsSection.status = :sectionStatus', {
            sectionStatus: true,
          });
      }

      if (newArrivals) {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        idQb.andWhere('product.createdAt >= :since', { since });
      }

      if (featured) {
        idQb
          .leftJoin('product.productOffers', 'productOffers')
          .andWhere('productOffers.isActive = :featuredActive', {
            featuredActive: true,
          });
      }

      const idRows = await idQb
        .distinct(true)
        .orderBy('product.createdAt', 'DESC')
        .addOrderBy('product.id', 'DESC')
        .getRawMany<{ id: string | number }>();

      // Deduplicate ids while preserving newest-first order
      const seenIds = new Set<number>();
      const productIds: number[] = [];
      for (const row of idRows) {
        const id = Number(row.id);
        if (!Number.isFinite(id) || id <= 0 || seenIds.has(id)) continue;
        seenIds.add(id);
        productIds.push(id);
      }

      if (!productIds.length) {
        return successResponse(
          { rows: [], count: 0, pageNumber, pageSize },
          'Store products retrieved successfully',
        );
      }

      // Step 2: load full product graphs for those ids
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.images', 'variantImages')
        .leftJoinAndSelect('variants.productVariantOffers', 'variantOffers')
        .leftJoinAndSelect('product.images', 'productImages')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('brand.brandOffers', 'brandOffers')
        .leftJoinAndSelect('product.productOffers', 'productOffers')
        .leftJoinAndSelect('product.reviews', 'reviews')
        .where('product.id IN (:...productIds)', { productIds })
        .getMany();

      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      const orderedProducts = productIds
        .map((id) => productById.get(id))
        .filter((product): product is Product => Boolean(product));

      const mapped = (
        await Promise.all(
          orderedProducts.map((product) => this.mapStoreProductCard(product)),
        )
      ).filter((row): row is StoreProductCard => row !== null);

      let filtered = mapped;

      if (hasMinPrice || hasMaxPrice) {
        filtered = filtered.filter((row) => {
          const price = Number(row.finalPrice);
          if (!Number.isFinite(price)) return true; // keep unpriced products
          if (hasMinPrice && price < minPrice) return false;
          if (hasMaxPrice && price > maxPrice) return false;
          return true;
        });
      }

      if (bestDeals) {
        filtered = filtered.filter((row) => row.hasDeal);
      }

      filtered = this.sortStoreProducts(filtered, sortBy);

      const count = filtered.length;
      const start = (pageNumber - 1) * pageSize;
      const rows = filtered.slice(start, start + pageSize);

      return successResponse(
        { rows, count, pageNumber, pageSize },
        'Store products retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  private parseBooleanFlag(value?: string): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }

  private sortStoreProducts(
    rows: StoreProductCard[],
    sortBy: string,
  ): StoreProductCard[] {
    const sorted = [...rows];

    switch (sortBy) {
      case 'price_asc':
        sorted.sort(
          (a, b) => Number(a.finalPrice || 0) - Number(b.finalPrice || 0),
        );
        break;
      case 'price_desc':
        sorted.sort(
          (a, b) => Number(b.finalPrice || 0) - Number(a.finalPrice || 0),
        );
        break;
      case 'name_asc':
        sorted.sort((a, b) =>
          (a.baseProductName || a.productName || '').localeCompare(
            b.baseProductName || b.productName || '',
          ),
        );
        break;
      case 'discount_desc':
        sorted.sort(
          (a, b) =>
            Number(b.discountPercentage || 0) -
            Number(a.discountPercentage || 0),
        );
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    return sorted;
  }

  private async mapStoreProductCard(
    product: Product,
  ): Promise<StoreProductCard | null> {
    // Same lowest-variant method as homepage (`mapProductCard`)
    const categoryWithHierarchy = product.category?.id
      ? await this.offerPricingService.loadCompleteCategoryHierarchy(
          product.category.id,
          new Set(),
        )
      : null;

    const bestVariantResult = this.offerPricingService.findBestVariant(
      product,
      categoryWithHierarchy,
    );

    if (!bestVariantResult) {
      return null;
    }

    const { variant, pricing } = bestVariantResult;
    const sortedVariantImages = [...(variant.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const sortedProductImages = [...(product.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const selectedImages =
      sortedVariantImages.length > 0
        ? sortedVariantImages
        : sortedProductImages;
    const fullProductName =
      `${product.productName || ''}${variant.name ? ` ${variant.name}` : ''}`.trim();

    const approvedReviews = (product.reviews || []).filter(
      (review) => review.isApproved,
    );
    const averageRating = approvedReviews.length
      ? approvedReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0,
        ) / approvedReviews.length
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isNew = new Date(product.createdAt) >= thirtyDaysAgo;
    const isFeatured = (product.productOffers || []).some(
      (offer) => offer?.isActive,
    );
    const hasDeal = Number(pricing.discountAmount || 0) > 0;

    return {
      id: product.id,
      productId: product.id,
      variantId: variant.id,
      productSlug: product.productSlug || null,
      productName: fullProductName,
      baseProductName: product.productName || null,
      variantName: variant.name || null,
      shortDescription: product.shortDescription || null,
      sku: variant.sku || null,
      stock: Number(variant.stock),
      inStock: Number(variant.stock) > 0,
      image: pickProductOrVariantCardImage(
        sortedProductImages,
        sortedVariantImages,
        400,
      ),
      images: selectedImages,
      originalPrice: pricing.originalPrice,
      finalPrice: pricing.finalPrice,
      discountAmount: pricing.discountAmount,
      discountPercentage: pricing.discountPercentage,
      appliedOffer: pricing.appliedOffer,
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: approvedReviews.length,
      isNew,
      isFeatured,
      hasDeal,
      createdAt: product.createdAt,
      category: categoryWithHierarchy
        ? {
            id: categoryWithHierarchy.id,
            categoryName: categoryWithHierarchy.categoryName,
            categorySlug: categoryWithHierarchy.categorySlug,
          }
        : product.category
          ? {
              id: product.category.id,
              categoryName: product.category.categoryName,
              categorySlug: product.category.categorySlug,
            }
          : null,
      brand: product.brand
        ? {
            id: product.brand.id,
            brandName: product.brand.brandName,
            brandSlug: product.brand.brandSlug,
          }
        : null,
    };
  }

  async getProductBySlug(slug: string) {
    try {
      const productLookup = await this.resolveProductLookup(slug);

      if (!productLookup) {
        return errorResponse('Product not found', 404);
      }

      const product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.images', 'variantImages')
        .leftJoinAndSelect(
          'variants.productVariantOffers',
          'productVariantOffers',
        )
        .leftJoinAndSelect('product.productOffers', 'productOffers')
        .leftJoinAndSelect('product.productAttributes', 'productAttributes')
        .leftJoinAndSelect('productAttributes.attribute', 'productAttribute')
        .leftJoinAndSelect('variants.variantAttributes', 'variantAttributes')
        .leftJoinAndSelect('variantAttributes.attribute', 'variantAttribute')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('brand.brandOffers', 'brandOffers')
        .leftJoinAndSelect('product.productTags', 'productTags')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.seo', 'seo')
        .leftJoinAndSelect(
          'product.frequentlyBoughtTogether',
          'frequentlyBoughtTogether',
        )
        .leftJoinAndSelect(
          'frequentlyBoughtTogether.images',
          'frequentlyBoughtTogetherImages',
        )
        .leftJoinAndSelect(
          'frequentlyBoughtTogether.variants',
          'frequentlyBoughtTogetherVariants',
        )
        .leftJoinAndSelect('product.faqs', 'faqs')
        .leftJoinAndSelect('product.reviews', 'reviews')
        .where('product.id = :productId', { productId: productLookup })
        .getOne();

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      if (product.category) {
        const categoryWithHierarchy =
          await this.offerPricingService.loadCompleteCategoryHierarchy(
            product.category.id,
            new Set(),
          );

        if (categoryWithHierarchy) {
          product.category = categoryWithHierarchy;
        }
      }

      if (product.images?.length) {
        product.images = [...product.images].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
      }

      if (product.variants?.length) {
        product.variants = product.variants
          .map((variant) => {
            const pricing = this.offerPricingService.buildVariantPricing(
              variant,
              product,
              product.category || null,
            );

            return {
              id: variant.id,
              name: variant.name,
              slug: variant.slug,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku,
              description: variant.description,
              createdAt: variant.createdAt,
              updatedAt: variant.updatedAt,
              images: [...(variant.images || [])].sort(
                (a, b) => a.sortOrder - b.sortOrder,
              ),
              variantAttributes: variant.variantAttributes || [],
              pricing,
            };
          })
          .sort((left, right) =>
            this.offerPricingService.compareVariantsByFinalPrice(left, right),
          ) as any;
      }

      if (product.faqs?.length) {
        product.faqs = [...product.faqs]
          .filter((faq) => faq.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }

      if (product.reviews?.length) {
        product.reviews = [...product.reviews].filter(
          (review) => review.isApproved,
        );
      }

      delete (product as any).relatedTo;
      if (product.frequentlyBoughtTogether) {
        product.frequentlyBoughtTogether = product.frequentlyBoughtTogether.map(
          (item) => ({
            id: item.id,
            productName: item.productName,
            productSlug: item.productSlug,
            shortDescription: item.shortDescription,
            image:
              pickProductCardImage(
                item.images
                  ?.slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)[0],
                400,
              ) || null,
            price:
              item.variants
                ?.map((variant) => Number(variant.price))
                .filter((price) => Number.isFinite(price))
                .sort((a, b) => a - b)[0] ?? null,
            inStock:
              item.variants?.some((variant) => Number(variant.stock) > 0) ??
              false,
          }),
        ) as any;
      }

      return successResponse(product, 'Product retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  private async resolveProductLookup(slug: string): Promise<number | null> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.productSlug'])
      .where('product.productSlug = :slug', { slug })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.publishStatus = :publishStatus', {
        publishStatus: PublishStatus.PUBLISHED,
      })
      .getOne();

    if (product) {
      return product.id;
    }

    const variant = await this.variationRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.slug = :slug', { slug })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.publishStatus = :publishStatus', {
        publishStatus: PublishStatus.PUBLISHED,
      })
      .getOne();

    return variant?.product?.id ?? null;
  }
  async addCartItem(
    userId: number | null,
    sessionId: string | null,
    dto: AddToCartDto,
  ) {
    if (!userId && !sessionId) {
      throw new BadRequestException('userId or sessionId is required');
    }

    if (userId && sessionId) {
      await this.mergeGuestCartIntoUser(userId, sessionId);
    }

    const { variation, unitPrice } = await this.resolveOfferUnitPrice(
      dto.variationId,
    );

    if (variation.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Get cart based on userId (authenticated) or sessionId (guest)
    const whereCondition = userId ? { userId } : { sessionId };
    let cart = await this.cartRepository.findOne({
      where: whereCondition as any,
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        ...(userId ? { userId } : {}),
        ...(sessionId ? { sessionId } : {}),
      });
      await this.cartRepository.save(cart);
      cart.items = [];
    }

    const existingItem = (cart.items || []).find(
      (item) => item.variationId === dto.variationId,
    );

    if (existingItem) {
      const nextQty = existingItem.quantity + dto.quantity;
      if (variation.stock < nextQty) {
        throw new BadRequestException('Insufficient stock');
      }
      existingItem.quantity = nextQty;
      // Keep cart in sync with current offer price (same as product page)
      existingItem.priceAtTime = unitPrice;
      return this.cartItemRepository.save(existingItem);
    }

    const newItem = this.cartItemRepository.create({
      cartId: cart.id,
      variationId: dto.variationId,
      quantity: dto.quantity,
      priceAtTime: unitPrice,
      attributesSnapshot: { name: variation.name, sku: variation.sku },
    });

    return this.cartItemRepository.save(newItem);
  }

  async getCartItems(userId: number | null, sessionId: string | null) {
    if (userId && sessionId) {
      await this.mergeGuestCartIntoUser(userId, sessionId);
    }

    const whereCondition = userId ? { userId } : { sessionId };
    const cart = await this.cartRepository.findOne({
      where: whereCondition as any,
      relations: ['items'],
    });

    if (!cart) return { items: [], total: 0 };

    const variationIds = [
      ...new Set(
        cart.items
          .map((item) => item.variationId)
          .filter((variationId) => Number.isFinite(variationId)),
      ),
    ];

    const variants = variationIds.length
      ? await this.variationRepository.find({
          where: { id: In(variationIds) },
          relations: [
            'product',
            'product.images',
            'product.productOffers',
            'product.brand',
            'product.brand.brandOffers',
            'product.category',
            'productVariantOffers',
            'images',
          ],
        })
      : [];

    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    const categoryCache = new Map<number, Category | null>();
    const priceUpdates: CartItem[] = [];

    const items: Array<{
      id: number;
      cartId: number;
      variationId: number;
      quantity: number;
      priceAtTime: number;
      sellingPrice: number | null;
      finalPrice: number;
      totalDiscount: number;
      appliedOffer: unknown;
      attributesSnapshot?: Record<string, unknown>;
      subtotal: number;
      productName: string;
      image: string | null;
      variantName: string | null;
      variant: {
        id: number;
        name: string | null;
        price: number;
        stock: number;
        sku: string | null;
        images: unknown[];
        product: {
          id: number;
          productName: string;
          productSlug: string | null;
          shortDescription: string | null;
          images: unknown[];
        } | null;
      } | null;
    }> = [];

    for (const item of cart.items) {
      const variant = variantMap.get(item.variationId) || null;
      const product = variant?.product || null;

      let category: Category | null = product?.category || null;
      if (product?.category?.id) {
        if (!categoryCache.has(product.category.id)) {
          categoryCache.set(
            product.category.id,
            (await this.offerPricingService.loadCompleteCategoryHierarchy(
              product.category.id,
              new Set(),
            )) || null,
          );
        }
        category = categoryCache.get(product.category.id) || null;
      }

      const pricing =
        variant && product
          ? this.offerPricingService.buildVariantPricing(
              variant,
              product,
              category,
            )
          : null;

      const listPrice = Number(variant?.price ?? item.priceAtTime);
      const unitPrice =
        pricing?.finalPrice != null && Number.isFinite(pricing.finalPrice)
          ? Number(pricing.finalPrice)
          : Number.isFinite(listPrice)
            ? listPrice
            : Number(item.priceAtTime) || 0;

      if (Number(item.priceAtTime) !== unitPrice) {
        item.priceAtTime = unitPrice;
        priceUpdates.push(item);
      }

      const subtotal = item.quantity * unitPrice;

      let image: string | null = null;

      if (variant?.images?.length) {
        image =
          [...variant.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]
            ?.originalUrl || null;
      } else if (variant?.product?.images?.length) {
        image =
          [...variant.product.images].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          )[0]?.originalUrl || null;
      }

      items.push({
        ...item,
        priceAtTime: unitPrice,
        sellingPrice: pricing?.sellingPrice ?? listPrice,
        finalPrice: unitPrice,
        totalDiscount: pricing?.totalDiscount ?? 0,
        appliedOffer: pricing?.appliedOffer ?? null,
        subtotal,
        productName: variant?.product?.productName || 'Unknown Product',
        image,
        variantName: variant?.name || null,
        variant: variant
          ? {
              id: variant.id,
              name: variant.name,
              price: Number(variant.price),
              stock: Number(variant.stock),
              sku: variant.sku,
              images: variant.images || [],
              product: variant.product
                ? {
                    id: variant.product.id,
                    productName: variant.product.productName,
                    productSlug: variant.product.productSlug,
                    shortDescription: variant.product.shortDescription,
                    images: variant.product.images || [],
                  }
                : null,
            }
          : null,
      });
    }

    if (priceUpdates.length) {
      await this.cartItemRepository.save(priceUpdates);
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return { items, total };
  }

  async updateCartItem(dto: UpdateCartDto) {
    const item = await this.cartItemRepository.findOne({
      where: { id: dto.cartItemId },
      relations: ['cart', 'variant'],
    });

    if (!item) throw new NotFoundException('Cart item not found');

    if (
      dto.sessionId &&
      item.cart?.sessionId &&
      item.cart.sessionId !== dto.sessionId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    if (dto.quantity <= 0) {
      await this.cartItemRepository.delete(item.id);
      return { message: 'Item removed', id: item.id };
    }

    if (item.variant && item.variant.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const { unitPrice } = await this.resolveOfferUnitPrice(item.variationId);
    item.quantity = dto.quantity;
    item.priceAtTime = unitPrice;
    return this.cartItemRepository.save(item);
  }

  private resolveShippingFromOrder(order: Order): OrderShippingAddress {
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      return order.shippingAddress;
    }

    return {
      addressId: null,
      label: null,
      fullName: '',
      phone: '',
      email: null,
      addressLine1: '',
      addressLine2: null,
      city: '',
      state: '',
      pincode: '',
    };
  }

  private async buildShippingAddress(
    dto: CheckoutDto,
  ): Promise<OrderShippingAddress> {
    if (dto.addressId) {
      if (!dto.userId) {
        throw new BadRequestException(
          'userId is required when using a saved address',
        );
      }

      const saved = await this.customerAddressService.getAddressForUser(
        dto.addressId,
        dto.userId,
      );
      if (!saved) {
        throw new NotFoundException('Saved address not found');
      }

      return {
        addressId: saved.id,
        label: saved.label,
        fullName: saved.fullName,
        phone: saved.phone,
        email: saved.email,
        addressLine1: saved.addressLine1,
        addressLine2: saved.addressLine2,
        city: saved.city,
        state: saved.state,
        pincode: saved.pincode,
      };
    }

    const fullName = dto.customerName?.trim();
    const phone = dto.phone?.trim();
    const addressLine1 = dto.addressLine1?.trim();
    const city = dto.city?.trim();
    const state = dto.state?.trim();
    const pincode = dto.pincode?.trim();

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      throw new BadRequestException(
        'Recipient name, phone, and full address are required',
      );
    }

    return {
      addressId: null,
      label: dto.addressLabel?.trim() || null,
      fullName,
      phone,
      email: dto.email?.trim() || null,
      addressLine1,
      addressLine2: dto.addressLine2?.trim() || null,
      city,
      state,
      pincode,
    };
  }

  private mapOrderResponse(
    order: Order,
    items: OrderItem[],
    extra: Record<string, unknown> = {},
  ) {
    const couponJson =
      order.couponJson && typeof order.couponJson === 'object'
        ? order.couponJson
        : null;
    const listSubtotal = Number(order.listSubtotal ?? order.subtotal);
    const discountTotal = Number(order.discountTotal ?? 0);
    const couponDiscount = Number(
      order.couponDiscount ?? couponJson?.couponDiscount ?? 0,
    );
    const offerDiscountFromItems = items.reduce((sum, row) => {
      const qty = Number(row.quantity) || 0;
      const perUnit = Number(row.discountAmount ?? 0);
      if (perUnit > 0) return sum + perUnit * qty;
      const list = Number(row.listUnitPrice ?? row.unitPrice) || 0;
      const unit = Number(row.unitPrice) || 0;
      return sum + Math.max(0, list - unit) * qty;
    }, 0);
    const offerDiscountTotal = Number(
      Math.max(0, discountTotal - couponDiscount) > 0
        ? Math.max(0, discountTotal - couponDiscount)
        : offerDiscountFromItems,
    );
    const couponId =
      couponJson?.id != null ? Number(couponJson.id) : null;
    const couponCode =
      couponJson?.couponCode != null ? String(couponJson.couponCode) : null;
    const couponDiscountType =
      couponJson?.discountType != null
        ? String(couponJson.discountType)
        : null;
    const couponDiscountValue =
      couponJson?.discountValue != null
        ? Number(couponJson.discountValue)
        : null;
    const shippingAddress = this.resolveShippingFromOrder(order);
    const offers = [
      ...new Map(
        items
          .map((row) =>
            row.offerJson && typeof row.offerJson === 'object'
              ? row.offerJson
              : null,
          )
          .filter((offer): offer is NonNullable<typeof offer> =>
            Boolean(offer?.id || offer?.offerName),
          )
          .map((offer) => [
            String(offer.id ?? offer.offerName),
            {
              id: offer.id,
              offerName: offer.offerName ?? null,
              offerSlug: offer.offerSlug ?? null,
              discountType: offer.discountType ?? null,
              discountValue:
                offer.discountValue != null
                  ? Number(offer.discountValue)
                  : null,
              sources: offer.sources ?? [],
            },
          ]),
      ).values(),
    ];

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      listSubtotal,
      discountTotal,
      offerDiscountTotal,
      couponDiscount,
      couponId,
      couponCode,
      couponDiscountType,
      couponDiscountValue,
      couponJson,
      coupon:
        couponId || couponCode
          ? {
              id: couponId,
              couponCode,
              discountType: couponDiscountType,
              discountValue: couponDiscountValue,
              couponDiscount,
            }
          : null,
      offers,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      shippingAddress,
      customerName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      email: shippingAddress.email,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      notes: order.notes,
      razorpayOrderId: order.razorpayOrderId,
      items: items.map((row) => {
        const offerJson =
          row.offerJson && typeof row.offerJson === 'object'
            ? row.offerJson
            : null;
        const listUnitPrice = Number(
          row.listUnitPrice ?? row.unitPrice,
        );
        const discountAmount = Number(row.discountAmount ?? 0);
        return {
          id: row.id,
          productName: row.productName,
          variantName: row.variantName,
          quantity: row.quantity,
          listUnitPrice,
          unitPrice: Number(row.unitPrice),
          discountAmount,
          subtotal: Number(row.subtotal),
          listSubtotal: listUnitPrice * Number(row.quantity || 0),
          image: row.image,
          offerJson,
          appliedOffer: offerJson,
        };
      }),
      createdAt: order.createdAt,
      ...extra,
    };
  }

  private async finalizePaidOrder(order: Order) {
    if (order.paymentStatus === 'paid') {
      return order;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the order row only — Postgres rejects FOR UPDATE with LEFT JOIN
      // (which TypeORM emits when loading OneToMany `items` with lock).
      const locked = await queryRunner.manager.findOne(Order, {
        where: { id: order.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new NotFoundException('Order not found');
      }

      if (locked.paymentStatus === 'paid') {
        await queryRunner.commitTransaction();
        return locked;
      }

      const items = await queryRunner.manager.find(OrderItem, {
        where: { orderId: locked.id },
      });

      for (const item of items) {
        if (!item.variationId) continue;
        const variant = await queryRunner.manager.findOne(ProductVariant, {
          where: { id: item.variationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!variant) {
          throw new BadRequestException(
            `Product variant unavailable for ${item.productName || 'item'}`,
          );
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.productName || variant.name}`,
          );
        }
      }

      for (const item of items) {
        if (!item.variationId) continue;
        await queryRunner.manager.decrement(
          ProductVariant,
          { id: item.variationId },
          'stock',
          item.quantity,
        );
      }

      if (order.razorpayPaymentId && !locked.razorpayPaymentId) {
        locked.razorpayPaymentId = order.razorpayPaymentId;
      }
      if (order.razorpaySignature && !locked.razorpaySignature) {
        locked.razorpaySignature = order.razorpaySignature;
      }

      locked.paymentStatus = 'paid';
      locked.orderStatus = 'confirmed';
      const saved = await queryRunner.manager.save(Order, locked);

      const whereCondition = locked.userId
        ? { userId: locked.userId }
        : { sessionId: locked.sessionId };
      if (locked.userId || locked.sessionId) {
        const cart = await queryRunner.manager.findOne(Cart, {
          where: whereCondition as any,
        });
        if (cart) {
          await queryRunner.manager.delete(CartItem, { cartId: cart.id });
        }
      }

      await queryRunner.commitTransaction();
      saved.items = items;
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async placeOrder(dto: CheckoutDto) {
    const userId = dto.userId ?? null;
    const sessionId = dto.sessionId ?? null;

    if (!userId && !sessionId) {
      throw new BadRequestException('userId or sessionId is required');
    }

    if (userId && sessionId) {
      await this.mergeGuestCartIntoUser(userId, sessionId);
    }

    const cartData = await this.getCartItems(userId, sessionId);
    if (!cartData.items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const isOnline = dto.paymentMethod === 'online';
    if (isOnline) {
      this.razorpayService.assertConfigured();
    }

    const shippingFee = 0;
    const offerLineSnapshots = cartData.items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(
        item.finalPrice ?? item.priceAtTime ?? 0,
      );
      const listUnitPrice = Number(
        item.sellingPrice != null && Number.isFinite(Number(item.sellingPrice))
          ? item.sellingPrice
          : unitPrice,
      );
      const perUnitDiscount = Math.max(
        0,
        Number(
          item.totalDiscount != null && Number.isFinite(Number(item.totalDiscount))
            ? item.totalDiscount
            : listUnitPrice - unitPrice,
        ),
      );
      const linePayable = Number(
        item.subtotal ?? quantity * unitPrice,
      );
      const lineList = listUnitPrice * quantity;
      const lineDiscount = Math.max(0, lineList - linePayable);
      const appliedOffer =
        item.appliedOffer && typeof item.appliedOffer === 'object'
          ? (item.appliedOffer as Record<string, unknown>)
          : null;

      return {
        variationId: item.variationId,
        productId: item.variant?.product?.id ?? null,
        productName: item.productName || 'Product',
        variantName: item.variantName || item.variant?.name || null,
        quantity,
        listUnitPrice,
        unitPrice,
        discountAmount: perUnitDiscount,
        lineListSubtotal: lineList,
        lineDiscount,
        linePayable,
        appliedOffer,
      };
    });

    const listSubtotal = offerLineSnapshots.reduce(
      (sum, row) => sum + row.lineListSubtotal,
      0,
    );
    const offerDiscountTotal = offerLineSnapshots.reduce(
      (sum, row) => sum + row.lineDiscount,
      0,
    );
    const merchandiseSubtotal = Number(cartData.total) || 0;

    let couponDiscount = 0;
    let appliedCoupon: {
      id: number;
      couponCode: string;
      discountType: string;
      discountValue: number;
      couponDiscount: number;
    } | null = null;

    if (dto.couponId) {
      const resolved = await this.resolveCheckoutDiscount(
        Number(dto.couponId),
        userId,
        merchandiseSubtotal,
      );
      if (!resolved) {
        throw new BadRequestException('Invalid or expired coupon');
      }
      couponDiscount = resolved.couponDiscount;
      appliedCoupon = {
        id: resolved.id,
        couponCode: resolved.couponCode,
        discountType: String(resolved.discountType),
        discountValue: resolved.discountValue,
        couponDiscount: resolved.couponDiscount,
      };
    }

    const discountTotal = offerDiscountTotal + couponDiscount;
    const subtotal = Math.max(0, merchandiseSubtotal - couponDiscount);
    const total = subtotal + shippingFee;

    const couponJson = appliedCoupon
      ? {
          id: appliedCoupon.id,
          couponCode: appliedCoupon.couponCode,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue,
          couponDiscount: appliedCoupon.couponDiscount,
          capturedAt: new Date().toISOString(),
        }
      : null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of cartData.items) {
        const variant = await queryRunner.manager.findOne(ProductVariant, {
          where: { id: item.variationId },
        });
        if (!variant) {
          throw new BadRequestException(
            `Product variant unavailable for ${item.productName || 'item'}`,
          );
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.productName || variant.name}`,
          );
        }
      }

      const orderNumber = this.generateOrderNumber();
      const shippingAddress = await this.buildShippingAddress(dto);
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        sessionId,
        shippingAddress,
        notes: dto.notes?.trim() || null,
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'pending',
        orderStatus: isOnline ? 'pending' : 'confirmed',
        listSubtotal: Number(listSubtotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        subtotal,
        shippingFee,
        total,
        couponDiscount: appliedCoupon?.couponDiscount ?? 0,
        couponJson,
        razorpayOrderId: null,
        razorpayPaymentId: null,
        razorpaySignature: null,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      const capturedAt = new Date().toISOString();
      const orderItems = cartData.items.map((item, index) => {
        const snapshotSku = item.attributesSnapshot?.sku;
        const sku =
          item.variant?.sku ||
          (typeof snapshotSku === 'string' ? snapshotSku : null);
        const offerLine = offerLineSnapshots[index];
        const applied = offerLine.appliedOffer;
        const offerJson: OrderItemOfferJson | null = applied
          ? {
              id:
                applied.id != null && Number.isFinite(Number(applied.id))
                  ? Number(applied.id)
                  : undefined,
              offerName:
                applied.offerName != null ? String(applied.offerName) : null,
              offerSlug:
                applied.offerSlug != null ? String(applied.offerSlug) : null,
              discountType:
                applied.discountType != null
                  ? String(applied.discountType)
                  : null,
              discountValue:
                applied.discountValue != null &&
                Number.isFinite(Number(applied.discountValue))
                  ? Number(applied.discountValue)
                  : null,
              sources: Array.isArray(applied.sources)
                ? applied.sources.map((s) => String(s))
                : [],
              listUnitPrice: Number(offerLine.listUnitPrice.toFixed(2)),
              unitPrice: Number(offerLine.unitPrice.toFixed(2)),
              discountAmount: Number(offerLine.discountAmount.toFixed(2)),
              capturedAt,
            }
          : null;

        return queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          variationId: item.variationId,
          productId: item.variant?.product?.id ?? null,
          productName: item.productName || 'Product',
          variantName: item.variantName || item.variant?.name || null,
          sku,
          image: item.image || null,
          quantity: item.quantity,
          listUnitPrice: Number(offerLine.listUnitPrice.toFixed(2)),
          unitPrice: Number(offerLine.unitPrice.toFixed(2)),
          discountAmount: Number(offerLine.discountAmount.toFixed(2)),
          subtotal: Number(offerLine.linePayable.toFixed(2)),
          offerJson,
        });
      });

      const savedItems = await queryRunner.manager.save(OrderItem, orderItems);

      let razorpayPayload: Record<string, unknown> | null = null;

      if (isOnline) {
        const rpOrder = await this.razorpayService.createOrder({
          amountInr: total,
          receipt: orderNumber,
          notes: {
            orderNumber,
            phone: shippingAddress.phone,
          },
        });
        savedOrder.razorpayOrderId = rpOrder.id;
        await queryRunner.manager.save(Order, savedOrder);

        razorpayPayload = {
          keyId: this.razorpayService.keyId,
          orderId: rpOrder.id,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: 'Vrindavan Rasa',
          description: `Order ${orderNumber}`,
          prefill: {
            name: shippingAddress.fullName,
            email: shippingAddress.email || undefined,
            contact: shippingAddress.phone,
          },
        };
        // Keep cart + stock until payment is verified / webhook confirms
      } else {
        for (const item of cartData.items) {
          await queryRunner.manager.decrement(
            ProductVariant,
            { id: item.variationId },
            'stock',
            item.quantity,
          );
        }

        const whereCondition = userId ? { userId } : { sessionId };
        const cart = await queryRunner.manager.findOne(Cart, {
          where: whereCondition as any,
        });
        if (cart) {
          await queryRunner.manager.delete(CartItem, { cartId: cart.id });
        }
      }

      await queryRunner.commitTransaction();

      return successResponse(
        this.mapOrderResponse(savedOrder, savedItems, {
          razorpay: razorpayPayload,
        }),
        isOnline
          ? 'Razorpay order created. Complete payment to confirm.'
          : 'Order placed successfully',
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyRazorpayPayment(dto: VerifyRazorpayPaymentDto) {
    const order = await this.orderRepository.findOne({
      where: { orderNumber: dto.orderNumber },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== 'online') {
      throw new BadRequestException('Order is not an online payment order');
    }

    if (order.paymentStatus === 'paid') {
      return successResponse(
        this.mapOrderResponse(order, order.items || []),
        'Payment already verified',
      );
    }

    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== dto.razorpay_order_id
    ) {
      throw new BadRequestException('Razorpay order mismatch');
    }

    const valid = this.razorpayService.verifyPaymentSignature({
      razorpayOrderId: dto.razorpay_order_id,
      razorpayPaymentId: dto.razorpay_payment_id,
      razorpaySignature: dto.razorpay_signature,
    });

    if (!valid) {
      order.paymentStatus = 'failed';
      await this.orderRepository.save(order);
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    order.razorpayPaymentId = dto.razorpay_payment_id;
    order.razorpaySignature = dto.razorpay_signature;
    await this.orderRepository.save(order);

    const finalized = await this.finalizePaidOrder(order);
    const withItems = await this.orderRepository.findOne({
      where: { id: finalized.id },
      relations: ['items'],
    });

    return successResponse(
      this.mapOrderResponse(withItems || finalized, withItems?.items || []),
      'Payment verified successfully',
    );
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined) {
    if (!this.razorpayService.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    let payload: {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    console.dir(rawBody, { depth: null });

    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid webhook body');
    }

    const event = payload.event || '';
    const payment = payload.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const razorpayPaymentId = payment?.id;

    if (!razorpayOrderId) {
      return successResponse({ ignored: true }, 'No order id in webhook');
    }

    const order = await this.orderRepository.findOne({
      where: { razorpayOrderId },
      relations: ['items'],
    });

    if (!order) {
      return successResponse({ ignored: true }, 'Order not found for webhook');
    }

    if (event === 'payment.captured' || payment?.status === 'captured') {
      if (razorpayPaymentId) {
        order.razorpayPaymentId = razorpayPaymentId;
        await this.orderRepository.save(order);
      }
      await this.finalizePaidOrder(order);
      return successResponse({ orderNumber: order.orderNumber }, 'Payment captured');
    }

    if (event === 'payment.failed') {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        await this.orderRepository.save(order);
      }
      return successResponse({ orderNumber: order.orderNumber }, 'Payment failed');
    }

    return successResponse({ ignored: true, event }, 'Webhook ignored');
  }

  async getUserOrders(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException('userId is required');
    }

    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    return successResponse(
      orders.map((order) =>
        this.mapOrderResponse(order, order.items || []),
      ),
      'Orders retrieved successfully',
    );
  }

  async getOrderByNumber(
    orderNumber: string,
    userId?: number | null,
    sessionId?: string | null,
  ) {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userId && order.userId && order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    if (
      !userId &&
      sessionId &&
      order.sessionId &&
      order.sessionId !== sessionId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    return successResponse(
      this.mapOrderResponse(order, order.items || []),
      'Order retrieved successfully',
    );
  }

  // ❌ Remove Item
  async removeCartItem(cartItemId: number, sessionId: string | null = null) {
    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify ownership if sessionId is provided
    if (sessionId && item.cart.sessionId !== sessionId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.cartItemRepository.delete(cartItemId);
    return { message: 'Item removed', id: cartItemId };
  }

  // 🧹 Clear Cart
  async clearCart(userId: number | null, sessionId: string | null) {
    const whereCondition = userId ? { userId } : { sessionId };
    const cart = await this.cartRepository.findOne({
      where: whereCondition as any,
    });

    if (!cart) return { message: 'Cart not found' };

    await this.cartItemRepository.delete({ cartId: cart.id });

    return { message: 'Cart cleared' };
  }

  // 📊 Get Cart Count
  async getCartCount(userId: number | null, sessionId: string | null) {
    const whereCondition = userId ? { userId } : { sessionId };
    const cart = await this.cartRepository.findOne({
      where: whereCondition as any,
      relations: ['items'],
    });

    if (!cart) return { count: 0 };

    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { count };
  }
}
