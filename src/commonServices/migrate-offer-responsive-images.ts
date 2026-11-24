import { DataSource } from 'typeorm';

export async function migrateOfferResponsiveImages(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ offers: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.offers') AS offers
  `);
  if (!tables[0]?.offers) return;

  const existingColumns: Array<{ column_name: string }> =
    await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'offers'
    `);
  const columns = new Set(existingColumns.map(({ column_name }) => column_name));

  await dataSource.query(`
    ALTER TABLE public.offers
      ADD COLUMN IF NOT EXISTS "desktopImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "tabletImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "mobileImage" character varying(2048),
      ADD COLUMN IF NOT EXISTS "useAsHeroBanner" boolean NOT NULL DEFAULT false
  `);

  if (columns.has('image')) {
    await dataSource.query(`
      UPDATE public.offers
      SET "desktopImage" = COALESCE(NULLIF("desktopImage", ''), NULLIF(image, ''))
      WHERE "desktopImage" IS NULL OR "desktopImage" = ''
    `);
    await dataSource.query(`
      ALTER TABLE public.offers DROP COLUMN image
    `);
  }
}
