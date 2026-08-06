-- Remove legacy policy sidebar modules and ensure CMS Pages menu exists.
-- Run manually if needed; the backend also syncs this on startup.

DELETE FROM permissions
WHERE "moduleId" IN (
  SELECT id FROM modules
  WHERE router_link ILIKE '%about-us%'
     OR router_link ILIKE '%privacy-policy%'
     OR router_link ILIKE '%refund-policy%'
     OR router_link ILIKE '%replace-policy%'
     OR router_link ILIKE '%delivery-and-shipping%'
     OR router_link ILIKE '%cancellation-and-return%'
     OR router_link ILIKE '%term-of-use%'
);

DELETE FROM role_module_access
WHERE "moduleId" IN (
  SELECT id FROM modules
  WHERE router_link ILIKE '%about-us%'
     OR router_link ILIKE '%privacy-policy%'
     OR router_link ILIKE '%refund-policy%'
     OR router_link ILIKE '%replace-policy%'
     OR router_link ILIKE '%delivery-and-shipping%'
     OR router_link ILIKE '%cancellation-and-return%'
     OR router_link ILIKE '%term-of-use%'
);

DELETE FROM modules
WHERE router_link ILIKE '%about-us%'
   OR router_link ILIKE '%privacy-policy%'
   OR router_link ILIKE '%refund-policy%'
   OR router_link ILIKE '%replace-policy%'
   OR router_link ILIKE '%delivery-and-shipping%'
   OR router_link ILIKE '%cancellation-and-return%'
   OR router_link ILIKE '%term-of-use%';

INSERT INTO modules (name, router_link, icon, "order", categories, "categoryOrderNo", category_icon, "isActive")
SELECT 'CMS Pages', '/admin/cms-pages', 'mat:article', 1, 'Content', 4, 'mat:article', true
WHERE NOT EXISTS (
  SELECT 1 FROM modules WHERE router_link ILIKE '%cms-pages%'
);
