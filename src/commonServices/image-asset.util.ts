import type { OptimizedImageColumns } from './optimized-image-columns';
import {
  deriveOptimizedColumnsFromOriginalUrl,
  emptyOptimizedImageColumns,
} from './optimized-image-columns';
import type { OptimizedImageColumnsDto } from '../dto/upload.dto';

/**
 * Resolve columns for DB write.
 * Prefer explicit asset fields when present; otherwise derive sibling size URLs
 * from the Sharp upload path (`…/original/…` → `…/400/image.webp`, etc.).
 */
export function resolveImageAsset(
  legacyUrl: string | null | undefined,
  asset?: OptimizedImageColumnsDto | null,
): OptimizedImageColumns | null {
  const url = (asset?.originalUrl || legacyUrl || '').trim();
  if (!url && !asset) return null;

  const derived = deriveOptimizedColumnsFromOriginalUrl(url);

  if (!asset) {
    return derived.originalUrl ? derived : null;
  }

  const columns = emptyOptimizedImageColumns(url || asset.originalUrl || '');
  columns.originalUrl = (asset.originalUrl || url).trim();
  columns.webp400 = asset.webp400 ?? derived.webp400 ?? null;
  columns.jpg400 = asset.jpg400 ?? derived.jpg400 ?? null;
  columns.webp800 = asset.webp800 ?? derived.webp800 ?? null;
  columns.jpg800 = asset.jpg800 ?? derived.jpg800 ?? null;
  columns.webp1200 = asset.webp1200 ?? derived.webp1200 ?? null;
  columns.jpg1200 = asset.jpg1200 ?? derived.jpg1200 ?? null;
  columns.webp1440 = asset.webp1440 ?? derived.webp1440 ?? null;
  columns.jpg1440 = asset.jpg1440 ?? derived.jpg1440 ?? null;
  columns.webp1920 = asset.webp1920 ?? derived.webp1920 ?? null;
  columns.jpg1920 = asset.jpg1920 ?? derived.jpg1920 ?? null;

  return columns.originalUrl ? columns : null;
}

/** Map a product/variant image input into DB column fields. */
export function productImageColumnFields(img: {
  originalUrl?: string;
  url?: string;
  webp400?: string | null;
  jpg400?: string | null;
  webp800?: string | null;
  jpg800?: string | null;
  webp1200?: string | null;
  jpg1200?: string | null;
}) {
  const originalUrl = (img.originalUrl || img.url || '').trim();
  const derived = deriveOptimizedColumnsFromOriginalUrl(originalUrl);
  return {
    originalUrl,
    webp400: img.webp400 ?? derived.webp400 ?? null,
    jpg400: img.jpg400 ?? derived.jpg400 ?? null,
    webp800: img.webp800 ?? derived.webp800 ?? null,
    jpg800: img.jpg800 ?? derived.jpg800 ?? null,
    webp1200: img.webp1200 ?? derived.webp1200 ?? null,
    jpg1200: img.jpg1200 ?? derived.jpg1200 ?? null,
  };
}
