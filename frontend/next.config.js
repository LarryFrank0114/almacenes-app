/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de internacionalización
  i18n: {
    locales: ['es', 'en', 'zh'],
    defaultLocale: 'es',
  },
  
  // Configuración de imágenes
  images: {
    domains: [
      'localhost',
      'voiarysvrncxnyegsitm.supabase.co',
      'via.placeholder.com'
    ],
  },

  // ✅ FORZAR VARIABLES DE ENTORNO
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Optimización
  swcMinify: true,
}

module.exports = nextConfig