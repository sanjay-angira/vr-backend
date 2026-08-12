import type { OptimizedImageColumns } from './optimized-image-columns';

export type ImageSizeFormat = 'webp' | 'jpg';

type ImageColumnSource = Partial<OptimizedImageColumns> & {
  url?: string | null;
  originalUrl?: string | null;
};

const WIDTH_KEYS = [400, 800, 1200, 1440, 1920] as const;

/**
 * Pick the best optimized URL from flat columns for a preferred display width.
 * Falls back to originalUrl / url when size columns are empty.
 */
export function pickOptimizedImageUrl(
  source: ImageColumnSource | string | null | undefined,
  preferredWidth: number,
  format: ImageSizeFormat = 'webp',
): string {
  if (!source) return '';
  if (typeof source === 'string') return source.trim();

  const fallback = (source.originalUrl || source.url || '').trim();

  const available = WIDTH_KEYS.filter((width) => {
    const webp = source[`webp${width}` as keyof ImageColumnSource];
    const jpg = source[`jpg${width}` as keyof ImageColumnSource];
    return Boolean(webp || jpg);
  });

  if (!available.length) {
    return fallback;
  }

  const bestWidth =
    available.find((w) => w >= preferredWidth) ??
    available[available.length - 1];

  const preferredKey = `${format}${bestWidth}` as keyof ImageColumnSource;
  const alternateKey = `${format === 'webp' ? 'jpg' : 'webp'}${bestWidth}` as keyof ImageColumnSource;

  const preferred = source[preferredKey];
  const alternate = source[alternateKey];

  return String(preferred || alternate || fallback).trim();
}
