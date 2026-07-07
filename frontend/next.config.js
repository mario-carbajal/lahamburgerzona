const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // Optimizador activo (sharp): sirve tamaños responsivos y WebP/AVIF —
    // clave en móvil, donde antes se bajaban las imágenes originales completas
    remotePatterns: [
      { protocol: 'https', hostname: 'api.hamburguezona.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || '',
  },
}

// Sentry solo se activa si hay un DSN configurado (ver sentry.*.config.js);
// si no, withSentryConfig simplemente no envuelve nada dañino en build.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // No subir sourcemaps sin un auth token configurado (evita fallos de build
  // en máquinas/CI que no tengan SENTRY_AUTH_TOKEN).
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});

