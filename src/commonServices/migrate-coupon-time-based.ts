import { DataSource } from 'typeorm';

export async function migrateCouponTimeBased(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ coupons: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.coupons') AS coupons
  `);
  if (!tables[0]?.coupons) return;

  await dataSource.query(`
    ALTER TABLE public.coupons
      ADD COLUMN IF NOT EXISTS "timeBased" boolean NOT NULL DEFAULT true
  `);
  await dataSource.query(`
    ALTER TABLE public.coupons
      ALTER COLUMN "startDate" DROP NOT NULL,
      ALTER COLUMN "endDate" DROP NOT NULL
  `);

  const dateColumns: Array<{ column_name: string; data_type: string }> =
    await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'coupons'
        AND column_name IN ('startDate', 'endDate')
    `);
  const columnTypes = new Map(
    dateColumns.map(({ column_name, data_type }) => [column_name, data_type]),
  );

  if (columnTypes.get('startDate') === 'date') {
    await dataSource.query(`
      ALTER TABLE public.coupons
        ALTER COLUMN "startDate" TYPE timestamptz
        USING ("startDate"::timestamp AT TIME ZONE 'UTC')
    `);
  }

  if (columnTypes.get('endDate') === 'date') {
    await dataSource.query(`
      ALTER TABLE public.coupons
        ALTER COLUMN "endDate" TYPE timestamptz
        USING (("endDate" + INTERVAL '1 day') AT TIME ZONE 'UTC' - INTERVAL '1 millisecond')
    `);
  }
}
