import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function optimizeImageUrl(url: string | null, quality = 70): string | null {
  // Devolver URL directa sin transformación para evitar error 403 en endpoint /render/image/
  // Las políticas de Storage de Supabase no permiten acceso al endpoint de transformación
  return url;
}
