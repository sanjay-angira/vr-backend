import { DataSource } from 'typeorm';

export async function migrateBannerResponsiveFields(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ banners: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.banners') AS banners
  `);
  if (!tables[0]?.banners) return;

  const existingColumns: Array<{ column_name: string }> =
    await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'banners'
    `);
  const columns = new Set(existingColumns.map(({ column_name }) => column_name));

  await dataSource.query(`
    ALTER TABLE public.banners
      ADD COLUMN IF NOT EXISTS "desktopImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "tabletImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "mobileImage" character varying(2048)
  `);

  const legacyImage = columns.has('image') ? `NULLIF("image"::text, '')` : 'NULL';
  await dataSource.query(`
    UPDATE public.banners
    SET "desktopImage" = COALESCE(NULLIF("desktopImage", ''), ${legacyImage})
    WHERE "desktopImage" IS NULL OR "desktopImage" = ''
  `);

  for (const column of ['title', 'subtitle', 'image', 'sectionId']) {
    if (!columns.has(column)) continue;
    await dataSource.query(`
      ALTER TABLE public.banners
        DROP COLUMN IF EXISTS "${column}" CASCADE
    `);
  }
}
