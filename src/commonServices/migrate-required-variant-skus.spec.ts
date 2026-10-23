import { DataSource } from 'typeorm';
import { migrateRequiredVariantSkus } from './migrate-required-variant-skus';

describe('migrateRequiredVariantSkus', () => {
  it('assigns placeholder SKUs to legacy variants and makes the column required', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string) => {
      statements.push(statement);
      if (statement.includes('to_regclass')) {
        return Promise.resolve([{ tableName: 'product_variants' }]);
      }
      return Promise.resolve();
    });

    await migrateRequiredVariantSkus({ query } as unknown as DataSource);

    expect(statements).toHaveLength(3);
    expect(statements[1]).toContain("SET sku = 'SKU-LEGACY-' || id::text");
    expect(statements[1]).toContain('WHERE sku IS NULL OR BTRIM(sku) =');
    expect(statements[2]).toContain('ALTER COLUMN sku SET NOT NULL');
  });

  it('skips the migration if the variants table does not exist yet', async () => {
    const query = jest.fn().mockResolvedValue([{ tableName: null }]);

    await migrateRequiredVariantSkus({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
