/*
  # Agregar imágenes a productos y categoría de Más Vendido

  1. Cambios en Tablas
    - `products`
      - Agregar columna `image_url` (text, nullable) para almacenar URL de imágenes
    
    - `categories`
      - Agregar categoría especial "MÁS VENDIDO" con prioridad 0
  
  2. Notas
    - Las imágenes se almacenarán en Supabase Storage
    - La columna image_url permite NULL para productos sin imagen
    - La categoría "MÁS VENDIDO" aparecerá primero por su prioridad 0
*/

-- Agregar columna de imagen a productos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

-- Crear categoría "MÁS VENDIDO" si no existe
INSERT INTO categories (name, priority)
VALUES ('MÁS VENDIDO', 0)
ON CONFLICT DO NOTHING;
