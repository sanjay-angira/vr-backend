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
      ADD COLUMN IF NOT EXISTS "desktopBanner" character varying(2048),
      ADD COLUMN IF NOT EXISTS "tabletBanner" character varying(2048),
      ADD COLUMN IF NOT EXISTS "mobileBanner" character varying(2048),
      ADD COLUMN IF NOT EXISTS "image3x2" character varying(2048),
      ADD COLUMN IF NOT EXISTS video character varying(2048),
      ADD COLUMN IF NOT EXISTS "useAsHeroBanner" boolean NOT NULL DEFAULT false
  `);

  const desktopImage = columns.has('desktopImage')
    ? `NULLIF("desktopImage", '')`
    : 'NULL';
  const bannerImage = columns.has('bannerImage')
    ? `NULLIF("bannerImage", '')`
    : 'NULL';
  const image = columns.has('image') ? `NULLIF(image, '')` : 'NULL';
  await dataSource.query(`
    UPDATE public.categories
    SET "desktopBanner" = COALESCE(
      NULLIF("desktopBanner", ''),
      ${desktopImage},
      ${bannerImage},
      ${image}
    )
    WHERE "desktopBanner" IS NULL OR "desktopBanner" = ''
  `);

  const tabletImage = columns.has('tabletImage')
    ? `NULLIF("tabletImage", '')`
    : 'NULL';
  if (columns.has('tabletImage')) {
    await dataSource.query(`
      UPDATE public.categories
      SET "tabletBanner" = COALESCE(NULLIF("tabletBanner", ''), ${tabletImage})
      WHERE "tabletBanner" IS NULL OR "tabletBanner" = ''
    `);
  }

  if (columns.has('mobileImage')) {
    await dataSource.query(`
      UPDATE public.categories
      SET "mobileBanner" = COALESCE(
        NULLIF("mobileBanner", ''),
        NULLIF("mobileImage", '')
      )
      WHERE "mobileBanner" IS NULL OR "mobileBanner" = ''
    `);
  }
}
