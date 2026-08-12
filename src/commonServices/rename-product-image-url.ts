import { DataSource } from 'typeorm';

type ColumnInfo = {
  column_name: string;
  character_maximum_length: number | null;
  is_nullable: string;
};

async function listImageUrlColumns(
  dataSource: DataSource,
  table: string,
): Promise<ColumnInfo[]> {
  return dataSource.query(
    `
    SELECT column_name, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name IN ('url', 'originalUrl')
    `,
    [table],
  );
}

/**
 * Ensure product/variant image tables use `originalUrl` varchar(2048) NOT NULL
 * BEFORE TypeORM synchronize. Synchronize would otherwise DROP+ADD the column
 * (length change) and fail with "contains null values" on existing rows.
 */
export async function renameProductImageUrlColumns(
  dataSource: DataSource,
): Promise<void> {
  for (const table of ['product_images', 'variant_images'] as const) {
    let columns = await listImageUrlColumns(dataSource, table);
    const byName = new Map(columns.map((c) => [c.column_name, c]));
    const hasUrl = byName.has('url');
    const hasOriginalUrl = byName.has('originalUrl');

    if (hasUrl && !hasOriginalUrl) {
      await dataSource.query(
        `ALTER TABLE "${table}" RENAME COLUMN "url" TO "originalUrl"`,
      );
      console.log(`[schema] ${table}: renamed url → originalUrl`);
      columns = await listImageUrlColumns(dataSource, table);
    } else if (hasUrl && hasOriginalUrl) {
      await dataSource.query(`
        UPDATE "${table}"
        SET "originalUrl" = url
        WHERE ("originalUrl" IS NULL OR "originalUrl" = '')
          AND url IS NOT NULL
          AND url <> ''
      `);
      await dataSource.query(`ALTER TABLE "${table}" DROP COLUMN "url"`);
      console.log(
        `[schema] ${table}: merged url into originalUrl and dropped url`,
      );
      columns = await listImageUrlColumns(dataSource, table);
    }

    const original = columns.find((c) => c.column_name === 'originalUrl');
    if (!original) {
      // Table empty / brand new — synchronize can create the column.
      continue;
    }

    // Fill any nulls so NOT NULL / length changes won't fail.
    await dataSource.query(`
      UPDATE "${table}"
      SET "originalUrl" = ''
      WHERE "originalUrl" IS NULL
    `);

    // Widen in place (avoids TypeORM DROP+ADD which wipes rows to null).
    if (
      original.character_maximum_length == null ||
      original.character_maximum_length < 2048
    ) {
      await dataSource.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN "originalUrl" TYPE character varying(2048)
      `);
      console.log(`[schema] ${table}: originalUrl → varchar(2048)`);
    }

    if (original.is_nullable === 'YES') {
      await dataSource.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN "originalUrl" SET NOT NULL
      `);
      console.log(`[schema] ${table}: originalUrl SET NOT NULL`);
    }
  }
}
