-- Run against a restored COPY after backup and schema migration, never as an automatic startup step.
-- Keeps the original Spanish tables and preserves category/item IDs.
BEGIN;
LOCK TABLE "CategoriasMenu", "ItemsMenu", menu_categories, menu_items IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM menu_categories) OR EXISTS (SELECT 1 FROM menu_items) THEN
    RAISE EXCEPTION 'Target menu is not empty; refusing to overwrite or merge existing data';
  END IF;
  IF EXISTS (SELECT 1 FROM "CategoriasMenu" WHERE length("Nombre") > 255 OR "CategoriaID" <= 0)
     OR EXISTS (SELECT 1 FROM "ItemsMenu" WHERE length("Nombre") > 255 OR length("Imagen") > 255
       OR "ItemID" <= 0 OR "Precio" < 0 OR "Precio" > 99999999.99 OR round("Precio", 2) <> "Precio") THEN
    RAISE EXCEPTION 'Legacy menu contains values incompatible with the target schema';
  END IF;
END $$;
INSERT INTO menu_categories (category_id, name, description)
  SELECT "CategoriaID", "Nombre", "Descripcion" FROM "CategoriasMenu";
INSERT INTO menu_items (item_id, name, image_url, description, price, category_id, is_available)
  SELECT "ItemID", "Nombre", "Imagen", "Descripcion", "Precio", "CategoriaID", "Disponible" FROM "ItemsMenu";
SELECT setval(pg_get_serial_sequence('menu_categories', 'category_id'), COALESCE((SELECT max(category_id) FROM menu_categories), 1), EXISTS (SELECT 1 FROM menu_categories));
SELECT setval(pg_get_serial_sequence('menu_items', 'item_id'), COALESCE((SELECT max(item_id) FROM menu_items), 1), EXISTS (SELECT 1 FROM menu_items));
COMMIT;
