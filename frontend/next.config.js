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

  // Optimización
  swcMinify: true,
}

module.exports = nextConfig
