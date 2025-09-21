import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout/Layout';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../hooks/useAuth';
import { initializeGlobalSession } from '../utils/globalSessionManager';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Inicializar el sistema global de sesión en TODAS las páginas
    const cleanup = initializeGlobalSession();
    
    // Limpiar al desmontar
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
