import { DataSource } from 'typeorm';
import { migrateProductVariantPackageDimensions } from './migrate-product-variant-package-dimensions';

describe('migrateProductVariantPackageDimensions', () => {
  it('adds required package dimension columns with temporary legacy values', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string) => {
      statements.push(statement);
      return Promise.resolve();
    });
    await migrateProductVariantPackageDimensions({
      query,
    } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
    const statement = statements[0] ?? '';
    expect(statement).toContain(
      'ADD COLUMN IF NOT EXISTS "packageHeightCm" numeric(10, 2) NOT NULL DEFAULT 1',
    );
    expect(statement).toContain(
      'ADD COLUMN IF NOT EXISTS "packageWidthCm" numeric(10, 2) NOT NULL DEFAULT 1',
    );
    expect(statement).toContain(
      'ADD COLUMN IF NOT EXISTS "packageLengthCm" numeric(10, 2) NOT NULL DEFAULT 1',
    );
    expect(statement).toContain(
      'ADD COLUMN IF NOT EXISTS "packageWeightGrams" numeric(10, 2) NOT NULL DEFAULT 1',
    );
  });
});
