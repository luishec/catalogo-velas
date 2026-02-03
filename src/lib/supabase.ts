import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function optimizeImageUrl(url: string | null, quality = 70): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('supabase')) {
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
      if (pathMatch) {
        const fullPath = pathMatch[1];
        return `${supabaseUrl}/storage/v1/render/image/public/${fullPath}?quality=${quality}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}
