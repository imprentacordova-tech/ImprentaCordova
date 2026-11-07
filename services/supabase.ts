import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Prevención de cuelgue por variables faltantes en Vercel
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ SUPABASE ERROR: Faltan variables de entorno (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). El sistema podría no funcionar correctamente.');
}

// Usamos valores placeholder si faltan para evitar que createClient lance TypeError al inicio
// Esto evita la "Pantalla Blanca" permitiendo que al menos el ErrorBoundary o el Layout se carguen.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-missing.supabase.co', 
  supabaseAnonKey || 'placeholder-key-missing'
);

export const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) {
    throw error;
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
};
