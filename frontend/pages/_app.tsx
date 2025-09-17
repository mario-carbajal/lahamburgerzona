import React from 'react';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout/Layout';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../hooks/useAuth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
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
