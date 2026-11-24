import { DataSource } from 'typeorm';
import { migrateCouponTimeBased } from './migrate-coupon-time-based';

describe('migrateCouponTimeBased', () => {
  it('adds timeBased and makes coupon dates optional', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ coupons: 'coupons' }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { column_name: 'startDate', data_type: 'date' },
        { column_name: 'endDate', data_type: 'date' },
      ])
      .mockResolvedValue(undefined);

    await migrateCouponTimeBased({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS "timeBased" boolean NOT NULL DEFAULT true',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER COLUMN "startDate" DROP NOT NULL'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER COLUMN "startDate" TYPE timestamptz'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER COLUMN "endDate" TYPE timestamptz'),
    );
  });

  it('does not convert coupon dates again when they already include times', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ coupons: 'coupons' }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { column_name: 'startDate', data_type: 'timestamp with time zone' },
        { column_name: 'endDate', data_type: 'timestamp with time zone' },
      ]);

    await migrateCouponTimeBased({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(4);
  });

  it('does not alter the schema if coupons table is missing', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ coupons: null }]);

    await migrateCouponTimeBased({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
