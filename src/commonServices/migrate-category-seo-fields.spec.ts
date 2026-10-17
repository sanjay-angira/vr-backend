import { DataSource } from 'typeorm';
import { migrateCategorySeoFields } from './migrate-category-seo-fields';

describe('migrateCategorySeoFields', () => {
  it('adds the category SEO columns idempotently', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const dataSource = { query } as unknown as DataSource;

    await migrateCategorySeoFields(dataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "secondaryKeywords" jsonb'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS "robotsIndex" boolean NOT NULL DEFAULT true',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS "robotsFollow" boolean NOT NULL DEFAULT true',
      ),
    );
  });
});
