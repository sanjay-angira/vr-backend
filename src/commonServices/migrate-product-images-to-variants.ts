import { DataSource } from 'typeorm';

async function tableExists(dataSource: DataSource, table: string) {
  const rows: Array<{ exists: boolean }> = await dataSource.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS "exists"
    `,
    [table],
  );
  return Boolean(rows[0]?.exists);
}

/** Remove retired legacy product gallery rows and their variant-image copies. */
export async function migrateProductImagesToVariants(
  dataSource: DataSource,
): Promise<void> {
  const hasLegacyImages = await tableExists(dataSource, 'product_images');
  const hasVariantImages = await tableExists(dataSource, 'variant_images');
  const hasVariants = await tableExists(dataSource, 'product_variants');

  if (!hasLegacyImages) return;

  if (!hasVariantImages || !hasVariants) {
    throw new Error(
      'Cannot remove legacy product images because the variant image schema is not ready.',
    );
  }

  await dataSource.transaction(async (manager) => {
    const legacyRows: Array<{ count: string }> = await manager.query(
      'SELECT COUNT(*)::text AS count FROM product_images',
    );
    if (Number(legacyRows[0]?.count || 0) === 0) return;

    await manager.query(`
      DELETE FROM variant_images variant_image
      USING product_variants variant, product_images product_image
      WHERE variant_image."variantId" = variant.id
        AND variant."productId" = product_image."productId"
        AND variant_image."originalUrl" = product_image."originalUrl"
    `);

    // Retired gallery images must not be reattached on a later startup.
    await manager.query('DELETE FROM product_images');
  });
}
