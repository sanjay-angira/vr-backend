import type { Category } from 'src/entities/productCategory/category.entity';
import type { BlogPost } from 'src/entities/blog/blog-posts.entity';
import type { Banner } from 'src/entities/CMS/banner.entity';
import type { VariantImage } from 'src/entities/product/variant-image.entity';
import { pickOptimizedImageUrl } from './image-url.util';

export type BannerImageRole = 'desktop' | 'mobile';

export function categoryImageSource(category: Category) {
  const url = (category.image || '').trim();
  return { originalUrl: url, url };
}

export function categoryMobileImageSource(category: Category) {
  const url = (category.mobileImage || '').trim();
  return { originalUrl: url, url };
}

export function categoryImageAlt(category: Category, fallback = '') {
  return category.imageAltText || fallback;
}

export function blogImageSource(blog: BlogPost) {
  const url = (blog.blogImage || '').trim();
  return { originalUrl: url, url };
}

export function blogImageAlt(blog: BlogPost, fallback = '') {
  return blog.blogImageAlt || fallback;
}

export function bannerImageSource(
  banner: Banner,
  role: BannerImageRole = 'desktop',
) {
  const raw =
    role === 'mobile' ? banner.mobileImage || banner.image : banner.image;
  const url = (raw || '').trim();
  return { originalUrl: url, url };
}

export function productImageSource(
  image: VariantImage | null | undefined,
) {
  if (!image) return { originalUrl: '', url: '' };
  return {
    originalUrl: image.originalUrl,
    url: image.originalUrl,
    webp400: image.webp400,
    webp800: image.webp800,
    webp1200: image.webp1200,
  };
}

export function pickProductCardImage(
  image: VariantImage | null | undefined,
  preferredWidth = 400,
) {
  // Prefer sized WebP; fall back to original so cards never go blank when
  // legacy uploads lack webp* columns.
  return pickOptimizedImageUrl(productImageSource(image), preferredWidth);
}

/**
 * Card image for the priced/selected variant.
 */
export function pickVariantCardImage(
  variantImages: VariantImage[] | null | undefined,
  preferredWidth = 400,
): string {
  const sorted = [...(variantImages || [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  for (const image of sorted) {
    const url = pickProductCardImage(image, preferredWidth);
    if (url) return url;
  }
  return '';
}
