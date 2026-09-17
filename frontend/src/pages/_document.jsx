import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* ✅ Iconos PWA */}
        <link rel="apple-touch-icon" sizes="180x180" href="/launchericon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/launchericon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/launchericon-144x144.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/launchericon-72x72.png" />
        
        {/* ✅ Meta tags para PWA */}
        <meta name="theme-color" content="#00d4ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CSM Almacenes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CSM Almacenes" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}