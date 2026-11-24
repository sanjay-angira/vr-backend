import { DataSource } from 'typeorm';
import { migrateWarehouses } from './migrate-warehouses';

describe('migrateWarehouses', () => {
  it('creates warehouse schema and product/order warehouse columns idempotently', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migrateWarehouses({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS public.warehouses'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON DELETE RESTRICT'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE "isDefault" = true'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UQ_warehouses_name_pin'),
    );
    expect(
      query.mock.calls.some(([statement]) =>
        String(statement).includes('"brandId"'),
      ),
    ).toBe(false);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"shipmentJson" jsonb'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "warehouseId" integer'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FK_product_warehouse'),
    );
  });
});
