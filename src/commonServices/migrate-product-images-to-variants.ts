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

/** Move legacy product gallery rows before TypeORM synchronize removes that relation. */
export async function migrateProductImagesToVariants(
  dataSource: DataSource,
): Promise<void> {
  const hasLegacyImages = await tableExists(dataSource, 'product_images');
  const hasVariantImages = await tableExists(dataSource, 'variant_images');
  const hasVariants = await tableExists(dataSource, 'product_variants');

  if (!hasLegacyImages) return;

  const legacyRows: Array<{ count: string }> = await dataSource.query(
    'SELECT COUNT(*)::text AS count FROM product_images',
  );
  if (Number(legacyRows[0]?.count || 0) === 0) return;

  if (!hasVariantImages || !hasVariants) {
    throw new Error(
      'Cannot migrate product_images because the variant image schema is not ready.',
    );
  }

  const unmatchedRows: Array<{ count: string }> = await dataSource.query(`
    SELECT COUNT(*)::text AS count
    FROM product_images product_image
    WHERE NOT EXISTS (
      SELECT 1
      FROM product_variants
      WHERE "productId" = product_image."productId"
    )
  `);
  if (Number(unmatchedRows[0]?.count || 0) > 0) {
    throw new Error(
      'Cannot remove product_images: at least one product image has no product variant to migrate onto.',
    );
  }

  await dataSource.query(`
    INSERT INTO variant_images (
      "originalUrl",
      "altText",
      "webp400",
      "webp800",
      "webp1200",
      "sortOrder",
      "variantId",
      "createdAt",
      "updatedAt"
    )
    SELECT
      product_image."originalUrl",
      product_image."altText",
      product_image."webp400",
      product_image."webp800",
      product_image."webp1200",
      product_image."sortOrder",
      variant.id,
      product_image."createdAt",
      product_image."updatedAt"
    FROM product_images product_image
    JOIN product_variants variant
      ON variant."productId" = product_image."productId"
    WHERE NOT EXISTS (
      SELECT 1
      FROM variant_images existing_image
      WHERE existing_image."variantId" = variant.id
        AND existing_image."originalUrl" = product_image."originalUrl"
        AND existing_image."sortOrder" = product_image."sortOrder"
    )
  `);
}