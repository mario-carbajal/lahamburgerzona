import React from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Layout from '../components/Layout/Layout';
import { CartProvider } from '../contexts/CartContext';
import { BusinessInfoProvider } from '../contexts/BusinessInfoContext';
import '../styles/globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Las páginas /admin/* tienen su propio AdminLayout (sidebar + topbar);
  // no deben llevar además el Header/Footer del sitio público.
  const isAdminRoute = router.pathname.startsWith('/admin');

  return (
    <>
      {/* Google Analytics: solo se carga si NEXT_PUBLIC_GA_ID está configurado,
          y nunca en el panel admin (tráfico interno que ensuciaría las métricas). */}
      {GA_ID && !isAdminRoute && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      <BusinessInfoProvider>
        <CartProvider>
          {isAdminRoute ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </CartProvider>
      </BusinessInfoProvider>
    </>
  );
}

export default MyApp;
