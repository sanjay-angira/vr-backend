-- Remove legacy productType column after migrating to variant-only products.
-- Safe to run if the column no longer exists.

ALTER TABLE product DROP COLUMN IF EXISTS "productType";
