import { DataSource } from 'typeorm';

export async function migrateBrandRemoval(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.product
      DROP COLUMN IF EXISTS "brandId";
  `);

  await dataSource.query(`
    ALTER TABLE IF EXISTS public.warehouses
      DROP COLUMN IF EXISTS "brandId";
  `);

  await dataSource.query(`
    DROP TABLE IF EXISTS public.brands CASCADE;
  `);
}
