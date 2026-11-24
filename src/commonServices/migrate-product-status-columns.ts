import { DataSource } from 'typeorm';

export async function migrateProductStatusColumns(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.product
      ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "newArrival" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "bestSeller" boolean NOT NULL DEFAULT false
  `);
}
