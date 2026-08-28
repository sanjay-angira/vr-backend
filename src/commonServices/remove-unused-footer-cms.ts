import { DataSource } from 'typeorm';

/**
 * Live footer chrome (contact, social, Razorpay) is static.
 * Drop leftover CMS tables and unused section types; keep menu columns + items.
 */
export async function removeUnusedFooterCms(ds: DataSource) {
  await ds.query(`DROP TABLE IF EXISTS "footer_social_links" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "footer_payment_methods" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "footer_settings" CASCADE`);

  const sectionsExist: Array<{ exists: boolean }> = await ds.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'footer_sections'
    ) AS "exists"
    `,
  );

  if (!sectionsExist[0]?.exists) return;

  await ds.query(`
    DELETE FROM footer_items
    WHERE "sectionId" IN (
      SELECT id FROM footer_sections WHERE type IS DISTINCT FROM 'menu'
    )
  `);
  await ds.query(
    `DELETE FROM footer_sections WHERE type IS DISTINCT FROM 'menu'`,
  );
}
