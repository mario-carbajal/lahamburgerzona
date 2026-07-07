import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // No capturar sesiones de replay por defecto (ahorra cuota del plan gratis);
  // se puede activar más adelante si hace falta reproducir bugs visuales.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
