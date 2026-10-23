import { DataSource } from 'typeorm';

export async function migrateRequiredVariantSkus(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ tableName: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.product_variants') AS "tableName"
  `);
  if (!tables[0]?.tableName) return;

  await dataSource.query(`
    UPDATE public.product_variants
    SET sku = 'SKU-LEGACY-' || id::text
    WHERE sku IS NULL OR BTRIM(sku) = ''
  `);
  await dataSource.query(`
    ALTER TABLE public.product_variants
      ALTER COLUMN sku SET NOT NULL
  `);
}
