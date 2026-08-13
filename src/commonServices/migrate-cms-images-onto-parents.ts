import { DataSource } from 'typeorm';

async function tableExists(ds: DataSource, table: string): Promise<boolean> {
  const rows: Array<{ exists: boolean }> = await ds.query(
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

async function columnExists(
  ds: DataSource,
  table: string,
  column: string,
): Promise<boolean> {
  const rows: Array<{ exists: boolean }> = await ds.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS "exists"
    `,
    [table, column],
  );
  return Boolean(rows[0]?.exists);
}

async function ensureVarcharColumn(
  ds: DataSource,
  table: string,
  column: string,
  length = 2048,
) {
  if (await columnExists(ds, table, column)) return;
  await ds.query(
    `ALTER TABLE "${table}" ADD COLUMN "${column}" character varying(${length})`,
  );
  console.log(`[schema] ${table}: added ${column}`);
}

/**
 * Copy banner/blog/category images from child *_images tables onto parent
 * columns BEFORE TypeORM synchronize drops the child entities.
 */
export async function migrateCmsImagesOntoParents(
  dataSource: DataSource,
): Promise<void> {
  // Categories
  await ensureVarcharColumn(dataSource, 'categories', 'image');
  await ensureVarcharColumn(dataSource, 'categories', 'imageAltText', 512);
  await ensureVarcharColumn(dataSource, 'categories', 'video');

  if (await tableExists(dataSource, 'category_images')) {
    await dataSource.query(`
      UPDATE categories c
      SET
        image = COALESCE(NULLIF(c.image, ''), img."originalUrl"),
        "imageAltText" = COALESCE(NULLIF(c."imageAltText", ''), img."altText"),
        video = COALESCE(NULLIF(c.video, ''), img.video)
      FROM (
        SELECT DISTINCT ON ("categoryId") *
        FROM category_images
        ORDER BY "categoryId", "sortOrder" ASC, id ASC
      ) img
      WHERE img."categoryId" = c.id
        AND (c.image IS NULL OR c.image = '')
    `);
    console.log('[schema] categories: backfilled from category_images');
  }

  // Drop deprecated category.image3d if still present.
  try {
    await dataSource.query(
      `ALTER TABLE categories DROP COLUMN IF EXISTS image3d`,
    );
  } catch {
    // ignore
  }

  // Blogs
  await ensureVarcharColumn(dataSource, 'blog_posts', 'blogImage');
  await ensureVarcharColumn(dataSource, 'blog_posts', 'blogImageAlt', 512);

  if (await tableExists(dataSource, 'blog_images')) {
    await dataSource.query(`
      UPDATE blog_posts b
      SET
        "blogImage" = COALESCE(NULLIF(b."blogImage", ''), img."originalUrl"),
        "blogImageAlt" = COALESCE(NULLIF(b."blogImageAlt", ''), img."altText")
      FROM (
        SELECT DISTINCT ON ("blogId") *
        FROM blog_images
        ORDER BY "blogId", "sortOrder" ASC, id ASC
      ) img
      WHERE img."blogId" = b.id
        AND (b."blogImage" IS NULL OR b."blogImage" = '')
    `);
    console.log('[schema] blog_posts: backfilled from blog_images');
  }

  // Banners
  await ensureVarcharColumn(dataSource, 'banners', 'image');
  await ensureVarcharColumn(dataSource, 'banners', 'mobileImage');

  if (await tableExists(dataSource, 'banner_images')) {
    await dataSource.query(`
      UPDATE banners b
      SET image = COALESCE(NULLIF(b.image, ''), img."originalUrl")
      FROM banner_images img
      WHERE img."bannerId" = b.id
        AND img.role = 'desktop'
        AND (b.image IS NULL OR b.image = '')
    `);
    await dataSource.query(`
      UPDATE banners b
      SET "mobileImage" = COALESCE(NULLIF(b."mobileImage", ''), img."originalUrl")
      FROM banner_images img
      WHERE img."bannerId" = b.id
        AND img.role = 'mobile'
        AND (b."mobileImage" IS NULL OR b."mobileImage" = '')
    `);
    console.log('[schema] banners: backfilled from banner_images');
  }
}
