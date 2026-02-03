/*
  # Configurar Storage y Autenticación Admin

  1. Storage
    - Crear bucket `product-images` para almacenar imágenes de productos
    - Configurar políticas de acceso público para lectura
    - Configurar política de escritura solo para usuarios autenticados
  
  2. Seguridad
    - RLS habilitado en el bucket
    - Lectura pública permitida
    - Escritura solo para usuarios autenticados
*/

-- Crear bucket para imágenes de productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Política para permitir lectura pública de imágenes
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Política para permitir subida de imágenes a usuarios autenticados
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Política para permitir actualización de imágenes a usuarios autenticados
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Política para permitir eliminación de imágenes a usuarios autenticados
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
