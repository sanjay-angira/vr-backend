import { DataSource } from 'typeorm';

export async function migrateWarehouses(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS public.warehouses (
      id SERIAL PRIMARY KEY,
      "brandId" integer NOT NULL,
      name varchar(120) NOT NULL,
      "contactName" varchar(120) NOT NULL,
      email varchar(254) NOT NULL,
      phone varchar(20) NOT NULL,
      "addressLine1" varchar(255) NOT NULL,
      "addressLine2" varchar(255),
      city varchar(100) NOT NULL,
      state varchar(100) NOT NULL,
      country varchar(100) NOT NULL DEFAULT 'India',
      pincode varchar(6) NOT NULL,
      "registeredName" varchar(150) NOT NULL,
      "returnAddress" varchar(500) NOT NULL,
      "returnPin" varchar(6) NOT NULL,
      "returnCity" varchar(100) NOT NULL,
      "returnState" varchar(100) NOT NULL,
      "returnCountry" varchar(100) NOT NULL DEFAULT 'India',
      "delhiveryWarehouseName" varchar(150),
      "delhiveryWarehouseId" varchar(150),
      "registrationStatus" varchar(32) NOT NULL DEFAULT 'PENDING',
      "registrationError" varchar(500),
      "registeredAt" timestamp,
      "isDefault" boolean NOT NULL DEFAULT false,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FK_warehouses_brand" FOREIGN KEY ("brandId")
        REFERENCES public.brands(id) ON DELETE RESTRICT
    )
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_warehouses_brand_id"
      ON public.warehouses ("brandId")
  `);
  await dataSource.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_warehouses_brand_name_pin"
      ON public.warehouses ("brandId", name, pincode)
  `);
  await dataSource.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_warehouses_brand_default"
      ON public.warehouses ("brandId") WHERE "isDefault" = true
  `);
  await dataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'CHK_warehouses_pincode'
          AND conrelid = 'public.warehouses'::regclass
      ) THEN
        ALTER TABLE public.warehouses
          ADD CONSTRAINT "CHK_warehouses_pincode"
          CHECK ("pincode" ~ '^[0-9]{6}$');
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'CHK_warehouses_return_pin'
          AND conrelid = 'public.warehouses'::regclass
      ) THEN
        ALTER TABLE public.warehouses
          ADD CONSTRAINT "CHK_warehouses_return_pin"
          CHECK ("returnPin" ~ '^[0-9]{6}$');
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'CHK_warehouses_phone'
          AND conrelid = 'public.warehouses'::regclass
      ) THEN
        ALTER TABLE public.warehouses
          ADD CONSTRAINT "CHK_warehouses_phone"
          CHECK (phone ~ '^[6-9][0-9]{9}$');
      END IF;
    END $$
  `);
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.orders
      ADD COLUMN IF NOT EXISTS "shipmentJson" jsonb
  `);
  await dataSource.query(`
    ALTER TABLE IF EXISTS public.product
      ADD COLUMN IF NOT EXISTS "warehouseId" integer
  `);
  await dataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'FK_product_warehouse'
          AND conrelid = 'public.product'::regclass
      ) THEN
        ALTER TABLE public.product
          ADD CONSTRAINT "FK_product_warehouse" FOREIGN KEY ("warehouseId")
          REFERENCES public.warehouses(id) ON DELETE RESTRICT;
      END IF;
    END $$
  `);
}
