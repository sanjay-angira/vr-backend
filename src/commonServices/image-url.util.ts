import type { OptimizedImageColumns } from './optimized-image-columns';

type ImageColumnSource = Partial<OptimizedImageColumns> & {
  url?: string | null;
  originalUrl?: string | null;
};

export type PickOptimizedImageOptions = {
  /** Never return a non-WebP original; empty string if no WebP is available. */
  webpOnly?: boolean;
};

const WIDTH_KEYS = [400, 800, 1200, 1440, 1920] as const;

function isWebpUrl(url: string): boolean {
  return /\.webp(\?|#|$)/i.test(url.trim());
}

/**
 * Pick the best WebP URL from flat columns for a preferred display width.
 * Falls back to originalUrl / url when size columns are empty (unless webpOnly).
 */
export function pickOptimizedImageUrl(
  source: ImageColumnSource | string | null | undefined,
  preferredWidth: number,
  options?: PickOptimizedImageOptions,
): string {
  if (!source) return '';
  if (typeof source === 'string') {
    const url = source.trim();
    if (options?.webpOnly && url && !isWebpUrl(url)) return '';
    return url;
  }

  const fallback = (source.originalUrl || source.url || '').trim();

  const available = WIDTH_KEYS.filter((width) => {
    const webp = source[`webp${width}` as keyof ImageColumnSource];
    return Boolean(webp);
  });

  if (!available.length) {
    if (options?.webpOnly) {
      return isWebpUrl(fallback) ? fallback : '';
    }
    return fallback;
  }

  const bestWidth =
    available.find((w) => w >= preferredWidth) ??
    available[available.length - 1];

  const preferred = source[`webp${bestWidth}` as keyof ImageColumnSource];
  const webpUrl = String(preferred || '').trim();
  if (webpUrl) return webpUrl;

  if (options?.webpOnly) {
    return isWebpUrl(fallback) ? fallback : '';
  }
  return fallback;
}
