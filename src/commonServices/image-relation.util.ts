import { BannerImageRole } from 'src/entities/CMS/banner-image.entity';
import type { Category } from 'src/entities/productCategory/category.entity';
import type { BlogPost } from 'src/entities/blog/blog-posts.entity';
import type { Banner } from 'src/entities/CMS/banner.entity';
import type { ProductImage } from 'src/entities/product/product-images.entity';
import type { VariantImage } from 'src/entities/product/variant-image.entity';
import { pickOptimizedImageUrl } from './image-url.util';

export function categoryImageSource(category: Category) {
  const row = category.images?.[0];
  if (!row) {
    return { originalUrl: '', url: '' };
  }
  return {
    originalUrl: row.originalUrl,
    webp400: row.webp400,
    jpg400: row.jpg400,
    webp800: row.webp800,
    jpg800: row.jpg800,
  };
}

export function categoryImageAlt(category: Category, fallback = '') {
  return category.images?.[0]?.altText || fallback;
}

export function blogImageSource(blog: BlogPost) {
  const row = [...(blog.images || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )[0];
  if (!row) {
    return { originalUrl: '', url: '' };
  }
  return {
    originalUrl: row.originalUrl,
    webp400: row.webp400,
    jpg400: row.jpg400,
    webp800: row.webp800,
    jpg800: row.jpg800,
    webp1200: row.webp1200,
    jpg1200: row.jpg1200,
  };
}

export function blogImageAlt(blog: BlogPost, fallback = '') {
  const row = [...(blog.images || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )[0];
  return row?.altText || fallback;
}

export function bannerImageSource(
  banner: Banner,
  role: BannerImageRole = BannerImageRole.DESKTOP,
) {
  const row = banner.images?.find((img) => img.role === role);
  if (!row) {
    return { originalUrl: '', url: '' };
  }
  return {
    originalUrl: row.originalUrl,
    webp800: row.webp800,
    jpg800: row.jpg800,
    webp1200: row.webp1200,
    jpg1200: row.jpg1200,
    webp1440: row.webp1440,
    jpg1440: row.jpg1440,
    webp1920: row.webp1920,
    jpg1920: row.jpg1920,
  };
}

export function productImageSource(
  image: ProductImage | VariantImage | null | undefined,
) {
  if (!image) return { originalUrl: '', url: '' };
  return {
    originalUrl: image.originalUrl,
    url: image.originalUrl,
    webp400: image.webp400,
    jpg400: image.jpg400,
    webp800: image.webp800,
    jpg800: image.jpg800,
    webp1200: image.webp1200,
    jpg1200: image.jpg1200,
  };
}

export function pickProductCardImage(
  image: ProductImage | VariantImage | null | undefined,
  preferredWidth = 400,
) {
  return pickOptimizedImageUrl(productImageSource(image), preferredWidth, 'webp');
}
