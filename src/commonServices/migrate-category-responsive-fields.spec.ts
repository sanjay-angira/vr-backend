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
        { column_name: 'desktopBanner' },
        { column_name: 'tabletBanner' },
        { column_name: 'mobileBanner' },
      ])
      .mockResolvedValue(undefined);

    await migrateCategoryResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "desktopImage"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "tabletImage"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "mobileImage"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "useAsHeroBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("desktopBanner", \'\')'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("mobileBanner", \'\')'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN IF EXISTS "desktopBanner"'),
    );
  });

  it('does nothing when the categories table is absent', async () => {
    const query = jest.fn().mockResolvedValue([{ categories: null }]);

    await migrateCategoryResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
