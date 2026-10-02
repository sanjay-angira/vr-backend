import { DataSource } from 'typeorm';
import { migrateProductImagesToVariants } from './migrate-product-images-to-variants';

describe('migrateProductImagesToVariants', () => {
  function createDataSource(unmatchedCount = 0) {
    const query = jest.fn(async (sql: string, parameters?: string[]) => {
      if (sql.includes('information_schema.tables')) {
        return [{ exists: true }];
      }
      if (sql.includes('FROM product_images') && sql.includes('NOT EXISTS')) {
        return [{ count: String(unmatchedCount) }];
      }
      if (sql.includes('FROM product_images')) {
        return [{ count: '2' }];
      }
      return [];
    });

    return { dataSource: { query } as unknown as DataSource, query };
  }

  it('copies legacy images onto every variant without duplicating existing rows', async () => {
    const { dataSource, query } = createDataSource();

    await migrateProductImagesToVariants(dataSource);

    const insert = query.mock.calls.at(-1)?.[0] as string;
    expect(insert).toContain('JOIN product_variants variant');
    expect(insert).toContain('variant."productId" = product_image."productId"');
    expect(insert).toContain('WHERE NOT EXISTS');
    expect(insert).toContain('existing_image."variantId" = variant.id');
  });

  it('refuses to continue when legacy images have no variant to receive them', async () => {
    const { dataSource, query } = createDataSource(1);

    await expect(migrateProductImagesToVariants(dataSource)).rejects.toThrow(
      'at least one product image has no product variant',
    );
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO variant_images'))).toBe(false);
  });
});