import { DataSource } from 'typeorm';
import { migrateBannerResponsiveFields } from './migrate-banner-responsive-fields';

describe('migrateBannerResponsiveFields', () => {
  it('backfills the desktop image and removes legacy banner fields', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ banners: 'banners' }])
      .mockResolvedValueOnce([
        { column_name: 'title' },
        { column_name: 'subtitle' },
        { column_name: 'image' },
        { column_name: 'mobileImage' },
        { column_name: 'sectionId' },
      ])
      .mockResolvedValue(undefined);

    await migrateBannerResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "desktopImage"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(NULLIF("desktopImage", \'\'), NULLIF("image"::text, \'\'))'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN IF EXISTS "sectionId" CASCADE'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN IF EXISTS "title" CASCADE'),
    );
  });

  it('does not alter the schema if the banners table is missing', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ banners: null }]);

    await migrateBannerResponsiveFields({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
