import { DataSource } from 'typeorm';
import { migrateOfferResponsiveImages } from './migrate-offer-responsive-images';

describe('migrateOfferResponsiveImages', () => {
  it('adds responsive image columns and migrates legacy images to desktop', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ offers: 'offers' }])
      .mockResolvedValueOnce([{ column_name: 'image' }])
      .mockResolvedValue(undefined);

    await migrateOfferResponsiveImages({ query } as unknown as DataSource);

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
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS "useAsHeroBanner" boolean NOT NULL DEFAULT false',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'COALESCE(NULLIF("desktopImage", \'\'), NULLIF(image, \'\'))',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN image'),
    );
  });

  it('does not alter the schema if offers table is missing', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ offers: null }]);

    await migrateOfferResponsiveImages({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
