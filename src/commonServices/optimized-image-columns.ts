/**
 * Flat optimized image URL columns shared across image entities / DTOs.
 * Original stays as uploaded; only WebP size variants are generated.
 * Unused sizes for a given preset remain null.
 */
export type OptimizedImageColumns = {
  originalUrl: string;
  webp400?: string | null;
  webp800?: string | null;
  webp1200?: string | null;
  webp1440?: string | null;
  webp1920?: string | null;
};

export const OPTIMIZED_IMAGE_WIDTHS = [
  400, 800, 1200, 1440, 1920,
] as const;

export type OptimizedImageWidth = (typeof OPTIMIZED_IMAGE_WIDTHS)[number];

export function emptyOptimizedImageColumns(
  originalUrl = '',
): OptimizedImageColumns {
  return {
    originalUrl,
    webp400: null,
    webp800: null,
    webp1200: null,
    webp1440: null,
    webp1920: null,
  };
}

/** Collect all non-empty sibling URLs for S3 cleanup. */
export function collectOptimizedImageUrls(
  columns: Partial<OptimizedImageColumns> | null | undefined,
): string[] {
  if (!columns) return [];
  const keys: (keyof OptimizedImageColumns)[] = [
    'originalUrl',
    'webp400',
    'webp800',
    'webp1200',
    'webp1440',
    'webp1920',
  ];
  const urls: string[] = [];
  for (const key of keys) {
    const value = columns[key];
    if (typeof value === 'string' && value.trim()) {
      urls.push(value.trim());
    }
  }
  return urls;
}

/**
 * Flatten nested sizes map { "400": { webp, jpg } } into column fields.
 * JPG size URLs are ignored — only WebP variants are kept.
 */
export function flattenSizesToColumns(
  originalUrl: string,
  sizes?: Record<string, { webp?: string; jpg?: string }> | null,
): OptimizedImageColumns {
  const columns = emptyOptimizedImageColumns(originalUrl);
  if (!sizes) return columns;

  for (const [widthKey, formats] of Object.entries(sizes)) {
    const width = Number(widthKey);
    if (!formats || !Number.isFinite(width)) continue;
    const webpKey = `webp${width}` as keyof OptimizedImageColumns;
    if (webpKey in columns && formats.webp) {
      (columns as Record<string, string | null>)[webpKey] = formats.webp;
    }
  }
  return columns;
}

export function setColumnForWidth(
  columns: OptimizedImageColumns,
  width: number,
  format: 'webp',
  url: string,
): void {
  const key = `${format}${width}` as keyof OptimizedImageColumns;
  if (key === 'originalUrl') return;
  (columns as Record<string, string | null>)[key] = url;
}

/**
 * Detect preset widths from the optimized upload folder path.
 * Upload layout: `{folder}/{assetId}/original/...` and `{folder}/{assetId}/{width}/image.webp`
 */
export function detectOptimizedWidthsFromUrl(originalUrl: string): number[] {
  const url = originalUrl.toLowerCase();
  if (url.includes('/banners/mobile/')) return [800, 1200];
  if (url.includes('/banners/')) return [1440, 1920];
  if (url.includes('/categories/')) return [400, 800];
  if (url.includes('/blogs/')) return [400, 800, 1200];
  if (url.includes('/products/')) return [400, 800, 1200];
  return [400, 800, 1200];
}

/**
 * Build flat size columns from an original URL produced by the Sharp upload pipeline.
 * Sizes are generated at upload time; save only needs the original URL.
 */
export function deriveOptimizedColumnsFromOriginalUrl(
  originalUrl: string | null | undefined,
  widths?: number[],
): OptimizedImageColumns {
  const url = (originalUrl || '').trim();
  const columns = emptyOptimizedImageColumns(url);
  if (!url) return columns;

  const marker = '/original/';
  const idx = url.indexOf(marker);
  if (idx === -1) return columns;

  const base = url.slice(0, idx);
  const targetWidths = widths?.length
    ? widths
    : detectOptimizedWidthsFromUrl(url);

  // Only WebP size variants are generated; JPG remains the original upload.
  for (const width of targetWidths) {
    setColumnForWidth(columns, width, 'webp', `${base}/${width}/image.webp`);
  }

  return columns;
}
