import { createClient } from '@supabase/supabase-js';
import env from '../config/env';

// Usar la configuración centralizada
const supabaseUrl = env.supabaseUrl;
const supabaseKey = env.supabaseKey;

// Log de depuración
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Inicializando Supabase:');
  console.log('  URL:', supabaseUrl ? '✅ Presente' : '❌ Faltante');
  console.log('  Key:', supabaseKey ? '✅ Presente' : '❌ Faltante');
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente para operaciones autenticadas
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);