/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  i18n: {
    locales: ['es', 'en', 'zh'],
    defaultLocale: 'es',
  },
  
  images: {
    domains: [
      'localhost',
      'voiarysvrncxnyegsitm.supabase.co',
      'via.placeholder.com'
    ],
  },

  swcMinify: true,

  // ✅ Headers para PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
}

module.exports = nextConfig