// Configuración centralizada de variables de entorno
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://voiarysvrncxnyegsitm.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaWFyeXN2cm5jeG55ZWdzaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjUwNzgsImV4cCI6MjEwMzUwMTA3OH0.e2UngMv4IxXx87HSfznzSCZhbbc47TNcP5DxXateIyU',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}

// Log de depuración (solo para desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('📋 Configuración de entorno:');
  console.log('  Supabase URL:', env.supabaseUrl ? '✅' : '❌');
  console.log('  Supabase Key:', env.supabaseKey ? '✅' : '❌');
  console.log('  API URL:', env.apiUrl ? '✅' : '❌');
}

export default env;