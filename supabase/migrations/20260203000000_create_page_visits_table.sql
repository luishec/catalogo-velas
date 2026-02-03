-- Crear tabla para registrar visitas y mantener la base de datos activa
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  page_path TEXT
);

-- Índice para mejorar rendimiento
CREATE INDEX idx_page_visits_visited_at ON page_visits(visited_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserciones anónimas (para registrar visitas)
CREATE POLICY "Permitir insertar visitas anónimas" ON page_visits
  FOR INSERT
  WITH CHECK (true);

-- Política para que solo administradores puedan ver las visitas
CREATE POLICY "Solo administradores pueden ver visitas" ON page_visits
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Función para limpiar visitas antiguas automáticamente (opcional)
-- Mantiene solo las últimas 1000 visitas
CREATE OR REPLACE FUNCTION cleanup_old_visits()
RETURNS void AS $$
BEGIN
  DELETE FROM page_visits
  WHERE id IN (
    SELECT id FROM page_visits
    ORDER BY visited_at DESC
    OFFSET 1000
  );
END;
$$ LANGUAGE plpgsql;
