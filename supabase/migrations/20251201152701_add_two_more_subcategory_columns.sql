/*
  # Agregar 2 subcategorías adicionales para productos

  1. Cambios
    - Se agregan las columnas `subcategory_6` y `subcategory_7` a la tabla products
    - Se agregan las columnas `image_url_6` e `image_url_7` para las imágenes correspondientes
    - Esto permite que productos como "VOLCÁN PERSONAJE" tengan hasta 7 subcategorías e imágenes

  2. Notas
    - Las columnas son opcionales (nullable)
    - Se mantiene la consistencia con las columnas existentes
*/

DO $$
BEGIN
  -- Agregar subcategory_6 si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_6'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_6 text;
  END IF;

  -- Agregar subcategory_7 si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_7'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_7 text;
  END IF;

  -- Agregar image_url_6 si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_6'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_6 text;
  END IF;

  -- Agregar image_url_7 si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_7'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_7 text;
  END IF;
END $$;
