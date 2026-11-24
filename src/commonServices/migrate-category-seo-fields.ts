import { DataSource } from 'typeorm';

export async function migrateCategorySeoFields(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.category_seo
      ADD COLUMN IF NOT EXISTS "metaKeywords" text,
      ADD COLUMN IF NOT EXISTS "metaRobots" character varying,
      ADD COLUMN IF NOT EXISTS "seoContent" text,
      ADD COLUMN IF NOT EXISTS "secondaryKeywords" jsonb,
      ADD COLUMN IF NOT EXISTS "robotsIndex" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "robotsFollow" boolean NOT NULL DEFAULT true
  `);
}
