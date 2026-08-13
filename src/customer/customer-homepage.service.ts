import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/commonServices/response.service';
import { OfferPricingService } from 'src/commonServices/offer-pricing.service';
import { CmsSection } from 'src/entities/CMS/cmsSettings.entity';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { Banner } from 'src/entities/CMS/banner.entity';
import { Review } from 'src/entities/product/review.entity';
import { pickOptimizedImageUrl } from 'src/commonServices/image-url.util';
import {
  bannerImageSource,
  blogImageSource,
  categoryImageSource,
  pickProductOrVariantCardImage,
} from 'src/commonServices/image-relation.util';

@Injectable()
export class CustomerHomepageService {
  constructor(
    @InjectRepository(CmsSection)
    private readonly cmsSectionRepository: Repository<CmsSection>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly offerPricingService: OfferPricingService,
  ) {}

  async getHomepage() {
    const sections = await this.cmsSectionRepository.find({
      where: { status: true },
      order: { position: 'ASC' },
    });

    const mappedSections = await Promise.all(
      sections.map(async (section) => this.mapSection(section)),
    );

    return successResponse(
      { sections: mappedSections },
      'Homepage sections retrieved successfully',
    );
  }

  /**
   * Lightweight slug list for Next.js /sitemap.xml.
   * Avoids heavy store/blog card payloads that time out during sitemap generation.
   */
  async getSitemapEntries() {
    const [products, blogs, categories] = await Promise.all([
      this.productRepository
        .createQueryBuilder('product')
        .select([
          'product.id',
          'product.productSlug',
          'product.updatedAt',
          'product.createdAt',
        ])
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.publishStatus = :publishStatus', {
          publishStatus: PublishStatus.PUBLISHED,
        })
        .andWhere('product.productSlug IS NOT NULL')
        .andWhere("product.productSlug != ''")
        .orderBy('product.updatedAt', 'DESC')
        .getMany(),
      this.blogRepository
        .createQueryBuilder('blog')
        .select([
          'blog.id',
          'blog.slug',
          'blog.updatedAt',
          'blog.createdAt',
          'blog.publishedAt',
        ])
        .where('blog.isActive = :isActive', { isActive: true })
        .andWhere('blog.status = :status', { status: 'published' })
        .andWhere('blog.slug IS NOT NULL')
        .andWhere("blog.slug != ''")
        .orderBy('blog.publishedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('blog.updatedAt', 'DESC')
        .getMany(),
      this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.id',
          'category.categorySlug',
          'category.updatedAt',
          'category.createdAt',
        ])
        .where('category.isActive = :isActive', { isActive: true })
        .andWhere('category.publishStatus = :publishStatus', {
          publishStatus: 'published',
        })
        .andWhere('category.categorySlug IS NOT NULL')
        .andWhere("category.categorySlug != ''")
        .orderBy('category.id', 'ASC')
        .getMany(),
    ]);

    const toIso = (value?: Date | null) =>
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString()
        : undefined;

    return successResponse(
      {
        products: products.map((product) => ({
          slug: product.productSlug,
          lastModified:
            toIso(product.updatedAt) || toIso(product.createdAt) || undefined,
        })),
        blogs: blogs.map((blog) => ({
          slug: blog.slug,
          lastModified:
            toIso(blog.updatedAt) ||
            toIso(blog.publishedAt) ||
            toIso(blog.createdAt) ||
            undefined,
        })),
        categories: categories.map((category) => ({
          slug: category.categorySlug,
          lastModified:
            toIso(category.updatedAt) ||
            toIso(category.createdAt) ||
            undefined,
        })),
      },
      'Sitemap entries retrieved successfully',
    );
  }

  private getMaxItems(section: CmsSection) {
    const maxProducts = Number(section.data?.maxProducts);
    return Number.isFinite(maxProducts) && maxProducts > 0 ? maxProducts : 8;
  }

  private async mapSection(section: CmsSection) {
    const limit = this.getMaxItems(section);
    const rawData =
      section.data && typeof section.data === 'object' ? section.data : {};

    const [products, categories, blogs, banners, reviews] = await Promise.all([
      this.loadProducts(section.id, limit),
      this.loadCategories(section.id, limit),
      this.loadBlogs(section.id, limit),
      this.loadBanners(section.id, limit),
      this.loadReviews(section.id, limit),
    ]);

    return {
      id: section.id,
      slug: section.slug || null,
      title: section.title,
      type: section.type,
      position: section.position,
      data: {
        ...rawData,
        heading: rawData.heading ?? '',
        subHeading: rawData.subHeading ?? '',
        headingAccent: rawData.headingAccent ?? '',
        description: rawData.description ?? '',
        displayStyle: rawData.displayStyle ?? 'grid',
        bannerEffect:
          rawData.bannerEffect === 'slide' ? 'slide' : 'fade',
        maxProducts: limit,
      },
      products,
      categories,
      blogs,
      banners,
      reviews,
    };
  }

  private async loadProducts(sectionId: number, limit: number) {
    // Limit by product id first — TypeORM `.take()` with multi-joins
    // otherwise truncates joined rows and can return far fewer products.
    const productIds = (
      await this.productRepository
        .createQueryBuilder('product')
        .innerJoin('product.sections', 'cmsSection')
        .select('product.id', 'id')
        .where('cmsSection.id = :sectionId', { sectionId })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .andWhere('product.publishStatus = :publishStatus', {
          publishStatus: PublishStatus.PUBLISHED,
        })
        .orderBy('product.id', 'ASC')
        .take(limit)
        .getRawMany()
    )
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!productIds.length) {
      return [];
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.images', 'variantImages')
      .leftJoinAndSelect('variants.productVariantOffers', 'variantOffers')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('brand.brandOffers', 'brandOffers')
      .leftJoinAndSelect('product.productOffers', 'productOffers')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.id IN (:...productIds)', { productIds })
      .getMany();

    const productById = new Map(products.map((product) => [product.id, product]));
    const orderedProducts = productIds
      .map((id) => productById.get(id))
      .filter((product): product is Product => Boolean(product));

    const mappedProducts = await Promise.all(
      orderedProducts.map(async (product) => {
        const categoryWithHierarchy = product.category?.id
          ? await this.offerPricingService.loadCompleteCategoryHierarchy(
              product.category.id,
            )
          : null;

        return this.mapProductCard(product, categoryWithHierarchy);
      }),
    );

    return mappedProducts.filter(Boolean);
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
      // Canonical product path — cards must not use variant.slug in /product/[slug]
      // or the PDP will rewrite the URL after hydrate.
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

  private async loadCategories(sectionId: number, limit: number) {
    const categories = await this.categoryRepository.find({
      where: {
        section: { id: sectionId },
        isActive: true,
        publishStatus: 'published',
      },
      relations: [],
      order: { id: 'ASC' },
      take: limit,
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.categoryName,
      description: category.shortDescription || category.description || '',
      image: pickOptimizedImageUrl(categoryImageSource(category), 400),
      slug: category.categorySlug,
      href: category.categorySlug
        ? `/products?category=${encodeURIComponent(category.categorySlug)}`
        : `/products`,
    }));
  }

  private async loadBlogs(sectionId: number, limit: number) {
    const blogs = await this.blogRepository.find({
      where: {
        section: { id: sectionId },
        isActive: true,
        status: 'published',
      },
      relations: ['category'],
      loadEagerRelations: false,
      order: { publishedAt: 'DESC', id: 'DESC' },
      take: limit,
    });

    return blogs.map((blog) => {
      const source = blogImageSource(blog);

      return {
        id: blog.id,
        title: blog.title,
        excerpt: blog.excerpt || '',
        image: pickOptimizedImageUrl(source, 400),
        category: blog.category?.title || '',
        date: blog.publishedAt
          ? new Date(blog.publishedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '',
        href: blog.slug ? `/blog/${blog.slug}` : '#',
      };
    });
  }

  private async loadBanners(sectionId: number, limit: number) {
    const banners = await this.bannerRepository.find({
      where: {
        section: { id: sectionId },
        status: true,
      },
      relations: [],
      order: { position: 'ASC', id: 'ASC' },
      take: limit,
    });

    return banners.map((banner) => ({
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
    }));
  }

  private async loadReviews(sectionId: number, limit: number) {
    const reviews = await this.reviewRepository.find({
      where: {
        section: { id: sectionId },
        isApproved: true,
      },
      relations: ['product', 'user'],
      loadEagerRelations: false,
      order: { id: 'DESC' },
      take: limit,
    });

    return reviews.map((review) => ({
      id: review.id,
      quote: review.comment || '',
      product: review.product?.productName || '',
      name: review.userName || review.user?.firstName || 'Customer',
      location: '',
      rating: Math.min(5, Math.max(0, Math.round(Number(review.rating || 0)))),
    }));
  }
}
