import { DataSource } from 'typeorm';

/**
 * Header chrome is now static on the storefront. Drop leftover CMS tables
 * and the admin "Header Settings" module row so nav links disappear.
 */
export async function removeHeaderCms(ds: DataSource) {
  await ds.query(`DROP TABLE IF EXISTS "menu_items" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "menus" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "announcement_bars" CASCADE`);
  await ds.query(`DROP TABLE IF EXISTS "site_settings" CASCADE`);

  const modulesExist: Array<{ exists: boolean }> = await ds.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'modules'
    ) AS "exists"
    `,
  );

  if (!modulesExist[0]?.exists) return;

  const headerModules: Array<{ id: number }> = await ds.query(
    `
    SELECT id
    FROM modules
    WHERE router_link ILIKE '%header-setting%'
       OR name ILIKE '%header setting%'
    `,
  );

  const ids = headerModules
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (ids.length === 0) return;

  const idList = ids.join(',');

  const accessExists: Array<{ exists: boolean }> = await ds.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'role_module_access'
    ) AS "exists"
    `,
  );

  if (accessExists[0]?.exists) {
    await ds.query(
      `DELETE FROM role_module_access WHERE "moduleId" IN (${idList})`,
    );
  }

  await ds.query(`DELETE FROM modules WHERE id IN (${idList})`);
}
