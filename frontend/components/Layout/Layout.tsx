import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { useBusinessInfo, phoneLink } from '../../contexts/BusinessInfoContext';

const SITE_URL = 'https://hamburguezona.com';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'La Hamburguezona - ¡Sabor que conquista!',
  description = 'Disfruta de las mejores hamburguesas en La Hamburguezona. Menú variado, ingredientes frescos y sabor auténtico. ¡Ordena ahora!'
}) => {
  const router = useRouter();
  const business = useBusinessInfo();
  const canonicalUrl = `${SITE_URL}${router.asPath === '/' ? '' : router.asPath.split('?')[0]}`;

  // Datos estructurados schema.org para SEO local (Google/Maps)
  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: business.name,
    url: SITE_URL,
    image: `${SITE_URL}/images/og-image.jpg`,
    ...(business.logoUrl ? { logo: business.logoUrl } : {}),
    servesCuisine: 'Hamburguesas',
    priceRange: '$$',
    telephone: phoneLink(business).replace('tel:', ''),
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Xalapa',
      addressRegion: 'Veracruz',
      addressCountry: 'MX',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '16:00',
      closes: '22:00',
    },
    menu: `${SITE_URL}/menu`,
    acceptsReservations: 'False',
    sameAs: business.facebookUrl ? [business.facebookUrl] : undefined,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="hamburguesas, comida rápida, delivery, La Hamburguezona, menú, pedidos online" />
        <meta name="author" content="La Hamburguezona" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${SITE_URL}/images/og-image.jpg`} />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={`${SITE_URL}/images/og-image.jpg`} />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Datos estructurados para SEO local */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </>
  );
};

export default Layout;

