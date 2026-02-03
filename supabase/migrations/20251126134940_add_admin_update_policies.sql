/*
  # Agregar políticas de administrador y subcategorías

  1. Cambios de Seguridad
    - Agregar política UPDATE para que usuarios autenticados puedan actualizar productos
    - Agregar política INSERT para agregar nuevos productos
    - Agregar política DELETE para eliminar productos

  2. Nueva Funcionalidad - Subcategorías
    - Agregar columna `subcategory` a la tabla products para permitir subcategorías dentro de cada categoría
    - La subcategoría es opcional y permite organizar mejor los productos

  3. Notas Importantes
    - Las políticas permiten a cualquier usuario autenticado gestionar productos (ideal para admin)
    - Las subcategorías son texto libre para máxima flexibilidad
*/

-- Agregar políticas de UPDATE, INSERT y DELETE para productos
CREATE POLICY "Usuarios autenticados pueden actualizar productos"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden insertar productos"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar productos"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Agregar columna de subcategoría a productos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory text;
  END IF;
END $$;
