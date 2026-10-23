import { DataSource } from 'typeorm';

export async function migrateProductVariantPackageDimensions(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.product_variants
      ADD COLUMN IF NOT EXISTS "packageHeightCm" numeric(10, 2) NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "packageWidthCm" numeric(10, 2) NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "packageLengthCm" numeric(10, 2) NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "packageWeightGrams" numeric(10, 2) NOT NULL DEFAULT 1
  `);
}
