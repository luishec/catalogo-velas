/*
  # Agregar múltiples columnas de subcategorías

  1. Modificaciones
    - Agregar columnas subcategory_2, subcategory_3, subcategory_4, subcategory_5 a la tabla products
    - Todas son de tipo texto y opcionales (nullable)
    - Esto permite asignar hasta 5 subcategorías diferentes por producto

  2. Notas
    - La columna subcategory existente se mantiene como subcategory_1
    - Cada producto puede tener de 0 a 5 subcategorías
*/

-- Agregar las nuevas columnas de subcategorías
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_2'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_3'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_3 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_4'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_5'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_5 text;
  END IF;
END $$;
