import type { OptimizedImageColumns } from './optimized-image-columns';

type ImageColumnSource = Partial<OptimizedImageColumns> & {
  url?: string | null;
  originalUrl?: string | null;
};

const WIDTH_KEYS = [400, 800, 1200, 1440, 1920] as const;

/**
 * Pick the best WebP URL from flat columns for a preferred display width.
 * Falls back to originalUrl / url when size columns are empty.
 */
export function pickOptimizedImageUrl(
  source: ImageColumnSource | string | null | undefined,
  preferredWidth: number,
): string {
  if (!source) return '';
  if (typeof source === 'string') return source.trim();

  const fallback = (source.originalUrl || source.url || '').trim();

  const available = WIDTH_KEYS.filter((width) => {
    const webp = source[`webp${width}` as keyof ImageColumnSource];
    return Boolean(webp);
  });

  if (!available.length) {
    return fallback;
  }

  const bestWidth =
    available.find((w) => w >= preferredWidth) ??
    available[available.length - 1];

  const preferred = source[`webp${bestWidth}` as keyof ImageColumnSource];
  return String(preferred || fallback).trim();
}
