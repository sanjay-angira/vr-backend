import { DataSource } from 'typeorm';

export async function migrateCategoryResponsiveFields(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ categories: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.categories') AS categories
  `);
  if (!tables[0]?.categories) return;

  const existingColumns: Array<{ column_name: string }> =
    await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'categories'
    `);
  const columns = new Set(existingColumns.map(({ column_name }) => column_name));

  await dataSource.query(`
    ALTER TABLE public.categories
      ADD COLUMN IF NOT EXISTS "desktopImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "tabletImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "mobileImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "image3x2" character varying(2048),
      ADD COLUMN IF NOT EXISTS video character varying(2048),
      ADD COLUMN IF NOT EXISTS "useAsHeroBanner" boolean NOT NULL DEFAULT false
  `);

  const desktopBanner = columns.has('desktopBanner')
    ? `NULLIF("desktopBanner", '')`
    : 'NULL';
  const previousDesktopImage = columns.has('desktopImage')
    ? `NULLIF("desktopImage", '')`
    : 'NULL';
  const bannerImage = columns.has('bannerImage')
    ? `NULLIF("bannerImage", '')`
    : 'NULL';
  const image = columns.has('image') ? `NULLIF(image, '')` : 'NULL';
  await dataSource.query(`
    UPDATE public.categories
    SET "desktopImage" = COALESCE(${desktopBanner}, ${previousDesktopImage}, ${bannerImage}, ${image})
  `);

  const tabletBanner = columns.has('tabletBanner')
    ? `NULLIF("tabletBanner", '')`
    : 'NULL';
  await dataSource.query(`
    UPDATE public.categories
    SET "tabletImage" = COALESCE(${tabletBanner}, NULLIF("tabletImage", ''))
  `);

  if (columns.has('mobileBanner')) {
    await dataSource.query(`
      UPDATE public.categories
      SET "mobileImage" = COALESCE(NULLIF("mobileBanner", ''), NULLIF("mobileImage", ''))
      WHERE "mobileBanner" IS NOT NULL AND "mobileBanner" <> ''
    `);
  }

  await dataSource.query(`
    ALTER TABLE public.categories
      DROP COLUMN IF EXISTS "desktopBanner",
      DROP COLUMN IF EXISTS "tabletBanner",
      DROP COLUMN IF EXISTS "mobileBanner"
  `);
}
