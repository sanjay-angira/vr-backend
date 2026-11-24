import { DataSource } from 'typeorm';
import { migrateCategoryResponsiveFields } from './migrate-category-responsive-fields';

describe('migrateCategoryResponsiveFields', () => {
  it('adds responsive fields and carries forward legacy category images', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ categories: 'categories' }])
      .mockResolvedValueOnce([
        { column_name: 'image' },
        { column_name: 'bannerImage' },
        { column_name: 'mobileImage' },
        { column_name: 'tabletImage' },
      ])
      .mockResolvedValue(undefined);

    await migrateCategoryResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "desktopBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "useAsHeroBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("bannerImage", \'\')'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("mobileImage", \'\')'),
    );
  });

  it('does nothing when the categories table is absent', async () => {
    const query = jest.fn().mockResolvedValue([{ categories: null }]);

    await migrateCategoryResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
