import { DataSource } from 'typeorm';

export async function removeUnusedFooterCms(ds: DataSource) {
  await ds.query(`DROP TABLE IF EXISTS "footer_social_links" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "footer_payment_methods" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "footer_settings" CASCADE`);

  const cmsTables: Array<{
    cmsSections: string | null;
    footerSections: string | null;
  }> = await ds.query(`
      SELECT
        to_regclass('public.cms_sections') AS "cmsSections",
        to_regclass('public.footer_sections') AS "footerSections"
    `);
  const { cmsSections, footerSections } = cmsTables[0] ?? {};

  if (!cmsSections) return;

  const enumTypes: Array<{ name: string }> = await ds.query(`
    SELECT t.typname AS name
    FROM pg_type t
    JOIN pg_attribute a ON a.atttypid = t.oid
    WHERE a.attrelid = to_regclass('public.cms_sections')
      AND a.attname = 'type'
      AND NOT a.attisdropped
      AND t.typtype = 'e'
    LIMIT 1
  `);
  const enumType = enumTypes[0]?.name;

  if (!enumType) {
    throw new Error(
      'Could not find the CMS section type enum for footer migration',
    );
  }

  await ds.query(
    `ALTER TYPE "${enumType.replace(/"/g, '""')}" ADD VALUE IF NOT EXISTS 'footer_section'`,
  );

  if (!footerSections) return;

  const footerItemsTables: Array<{ footerItems: string | null }> =
    await ds.query(`
      SELECT to_regclass('public.footer_items') AS "footerItems"
    `);
  const hasFooterItems = Boolean(footerItemsTables[0]?.footerItems);
  const itemsQuery = hasFooterItems
    ? `COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', item.id,
            'label', item.label,
            'url', item.url,
            'position', item.position,
            'status', item.status
          )
          ORDER BY item.position ASC, item.id ASC
        )
        FROM footer_items item
        WHERE item."sectionId" = section.id
      ), '[]'::jsonb)`
    : `'[]'::jsonb`;

  await ds.query(`
    INSERT INTO cms_sections (title, slug, type, position, status, data)
    SELECT
      section.title,
      NULL,
      'footer_section',
      section.position,
      section.status,
      jsonb_build_object(
        'footerLinks', ${itemsQuery},
        'legacyFooterSectionId', section.id
      )
    FROM footer_sections section
    WHERE NOT EXISTS (
      SELECT 1
      FROM cms_sections cms
      WHERE cms.type = 'footer_section'
        AND cms.data->>'legacyFooterSectionId' = section.id::text
    )
  `);

  await ds.query(`DROP TABLE IF EXISTS "footer_items" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "footer_sections" CASCADE`);
}
