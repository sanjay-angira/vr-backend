import { DataSource } from 'typeorm';
import { migrateProductImagesToVariants } from './migrate-product-images-to-variants';

describe('migrateProductImagesToVariants', () => {
  function createDataSource() {
    const query = jest.fn((sql: string) => {
      if (sql.includes('information_schema.tables')) {
        return [{ exists: true }];
      }
      if (sql.includes('SELECT COUNT(*)::text AS count FROM product_images')) {
        return [{ count: '2' }];
      }
      return [];
    });

    const transaction = jest.fn(
      async (work: (manager: { query: typeof query }) => Promise<void>) =>
        work({ query }),
    );

    return {
      dataSource: { query, transaction } as unknown as DataSource,
      query,
      transaction,
    };
  }

  it('removes legacy variant copies and source rows transactionally', async () => {
    const { dataSource, query, transaction } = createDataSource();

    await migrateProductImagesToVariants(dataSource);

    const variantDeleteIndex = query.mock.calls.findIndex(([sql]) =>
      String(sql).includes('DELETE FROM variant_images'),
    );
    const legacyDeleteIndex = query.mock.calls.findIndex(([sql]) =>
      String(sql).includes('DELETE FROM product_images'),
    );
    const variantDelete = query.mock.calls[variantDeleteIndex]?.[0];
    expect(variantDelete).toContain(
      'USING product_variants variant, product_images product_image',
    );
    expect(variantDelete).toContain(
      'variant."productId" = product_image."productId"',
    );
    expect(variantDelete).toContain(
      'variant_image."originalUrl" = product_image."originalUrl"',
    );
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(variantDeleteIndex).toBeGreaterThanOrEqual(0);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO variant_images'),
      ),
    ).toBe(false);
    expect(legacyDeleteIndex).toBeGreaterThan(variantDeleteIndex);
  });
});
