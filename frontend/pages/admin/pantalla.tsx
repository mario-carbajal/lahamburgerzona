import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { ChefHat, CheckCircle2 } from 'lucide-react';
import { withAuth } from '../../middleware/auth';
import { useBusinessInfo } from '../../contexts/BusinessInfoContext';
import apiService from '../../services/api';
import type { Order } from '../../services/api';

/**
 * Pantalla para cliente (segundo monitor): tablero de pedidos en preparación y
 * listos para recoger. Sin chrome de admin — pensada para F11 (pantalla completa)
 * en un monitor de cara al público. Se actualiza sola cada 10 segundos.
 */
const PantallaCliente = () => {
  const business = useBusinessInfo();
  const [preparando, setPreparando] = useState<Order[]>([]);
  const [listos, setListos] = useState<Order[]>([]);
  const [hora, setHora] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiService.getOrders();
        if (res.ok) {
          const orders = res.data as Order[];
          setPreparando(orders.filter((o) => o.status === 'preparing'));
          setListos(orders.filter((o) => o.status === 'ready'));
        }
      } catch {
        // sin conexión momentánea: se conserva lo último mostrado
      }
    };
    cargar();
    const timer = setInterval(cargar, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, []);

  // Número corto y legible para el cliente: últimos 4 dígitos del folio
  const numeroCorto = (o: Order) => `#${String(o.order_number).slice(-4)}`;
  const nombreCorto = (o: Order) => (o.customer_name || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      <Head>
        <title>Pedidos - {business.name}</title>
      </Head>

      {/* Encabezado */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-4">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 bg-gradient-warm rounded-full flex items-center justify-center">
              <span className="text-3xl">🍔</span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            <p className="text-gray-400">{business.slogan}</p>
          </div>
        </div>
        <div className="text-5xl font-bold tabular-nums text-gray-300">{hora}</div>
      </header>

      {/* Tablero */}
      <main className="flex-1 grid grid-cols-2">
        {/* En preparación */}
        <section className="p-8 border-r border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <ChefHat className="w-10 h-10 text-yellow-400" />
            <h2 className="text-4xl font-bold text-yellow-400">Preparando</h2>
          </div>
          {preparando.length === 0 ? (
            <p className="text-2xl text-gray-500 mt-12 text-center">Sin pedidos en preparación</p>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {preparando.map((o) => (
                <div key={o.id} className="bg-white/5 border border-yellow-400/30 rounded-2xl p-6 text-center">
                  <p className="text-5xl font-extrabold tabular-nums">{numeroCorto(o)}</p>
                  <p className="text-xl text-gray-400 mt-2 truncate">{nombreCorto(o)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Listos */}
        <section className="p-8 bg-green-500/5">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <h2 className="text-4xl font-bold text-green-400">¡Listos!</h2>
          </div>
          {listos.length === 0 ? (
            <p className="text-2xl text-gray-500 mt-12 text-center">Ningún pedido listo aún</p>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {listos.map((o) => (
                <div
                  key={o.id}
                  className="bg-green-500/15 border-2 border-green-400 rounded-2xl p-6 text-center animate-pulse"
                >
                  <p className="text-5xl font-extrabold tabular-nums text-green-300">{numeroCorto(o)}</p>
                  <p className="text-xl text-green-200/80 mt-2 truncate">{nombreCorto(o)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="px-8 py-3 text-center text-gray-500 text-sm border-t border-white/10">
        Gracias por tu preferencia · {business.openingHours}
      </footer>
    </div>
  );
};

export default withAuth(PantallaCliente);
