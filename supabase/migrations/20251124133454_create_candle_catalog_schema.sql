/*
  # Esquema de Catálogo de Velas de Cumpleaños

  1. Nuevas Tablas
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text) - Nombre de la categoría (NUMEROS, PLANCHAS, etc.)
      - `priority` (integer) - Orden de prioridad para mostrar
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `code` (text, unique) - Código del producto (CLA00, ESC00, etc.)
      - `name` (text) - Nombre del producto
      - `is_bestseller` (boolean) - Indica si es "Mas vendido"
      - `created_at` (timestamp)
  
  2. Seguridad
    - Habilitar RLS en ambas tablas
    - Permitir lectura pública (catálogo para distribuidores)
    
  3. Notas Importantes
    - Los productos están organizados por categorías
    - Se incluye un campo para marcar productos más vendidos
    - Sistema diseñado para distribuidores/fiesterías
*/

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  priority integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_bestseller boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (catálogo)
CREATE POLICY "Permitir lectura pública de categorías"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir lectura pública de productos"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_categories_priority ON categories(priority);