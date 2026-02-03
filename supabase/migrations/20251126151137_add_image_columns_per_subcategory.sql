/*
  # Agregar columnas de imágenes por subcategoría

  1. Modificaciones
    - Agregar columnas image_url_2, image_url_3, image_url_4, image_url_5 a la tabla products
    - Todas son de tipo texto y opcionales (nullable)
    - Esto permite asignar una imagen diferente para cada subcategoría
    - La columna image_url existente se mantiene para la subcategoría 1

  2. Notas
    - Cada subcategoría puede tener su propia imagen específica
    - image_url corresponde a subcategory
    - image_url_2 corresponde a subcategory_2
    - image_url_3 corresponde a subcategory_3
    - image_url_4 corresponde a subcategory_4
    - image_url_5 corresponde a subcategory_5
*/

-- Agregar las nuevas columnas de imágenes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_2'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_3'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_3 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_4'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url_5'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url_5 text;
  END IF;
END $$;
