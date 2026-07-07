import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { User, Star, RotateCcw, LogOut, Clock } from 'lucide-react';
import apiService from '../services/api';
import type { Order } from '../services/api';
import { useCart } from '../contexts/CartContext';
import {
  getClienteSesion,
  setClienteSesion,
  clearClienteSesion,
  ClienteSesion,
} from '../utils/clienteSession';

const money = (n: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Recibido', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', cls: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'En cocina', cls: 'bg-orange-100 text-orange-800' },
  ready: { label: '¡Listo!', cls: 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregado', cls: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
};

const MiCuentaPage = () => {
  const router = useRouter();
  const { addToCart } = useCart();

  const [sesion, setSesion] = useState<ClienteSesion | null>(null);
  const [cargado, setCargado] = useState(false);

  // Formulario de acceso
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accediendo, setAccediendo] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState('');

  // Datos de la cuenta
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [reordenando, setReordenando] = useState<string | null>(null);

  useEffect(() => {
    const s = getClienteSesion();
    setSesion(s);
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!sesion) return;
    const cargar = async () => {
      setCargandoPedidos(true);
      try {
        // Refresca el perfil (puntos al día) y trae el historial
        const [perfilRes, pedidosRes] = await Promise.all([
          apiService.getPerfilCuenta(),
          apiService.getMisPedidos(1, 15),
        ]);
        if (perfilRes.ok) {
          const actualizada = { ...sesion, customer: perfilRes.data };
          setClienteSesion(actualizada);
          setSesion(actualizada);
        }
        if (pedidosRes.ok) setPedidos(pedidosRes.data);
      } catch (error: any) {
        // Sesión expirada (el token dura 30 días): se pide acceso de nuevo
        clearClienteSesion();
        setSesion(null);
      } finally {
        setCargandoPedidos(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.token]);

  const handleAcceso = async () => {
    const digitos = phone.replace(/\D/g, '');
    if (!email.trim() || digitos.length !== 10) {
      setErrorAcceso('Captura tu email y tu teléfono de 10 dígitos');
      return;
    }
    setAccediendo(true);
    setErrorAcceso('');
    try {
      const res = await apiService.accesoCuenta(email.trim(), digitos);
      const nueva = { token: res.data.token, customer: res.data.customer };
      setClienteSesion(nueva);
      setSesion(nueva);
    } catch (error: any) {
      setErrorAcceso(error.message || 'No se pudo acceder');
    } finally {
      setAccediendo(false);
    }
  };

  const handleSalir = () => {
    clearClienteSesion();
    setSesion(null);
    setPedidos([]);
  };

  // Vuelve a llenar el carrito con un pedido anterior, a precios actuales
  const volverAPedir = async (pedido: Order) => {
    setReordenando(String(pedido.id));
    try {
      const menuRes = await apiService.getMenuItems();
      const menuActivo = new Map(
        menuRes.data.filter((m: any) => m.is_active).map((m: any) => [Number(m.id), m])
      );

      let agregados = 0;
      let omitidos = 0;
      for (const item of pedido.items) {
        const producto = item.menu_item_id ? menuActivo.get(Number(item.menu_item_id)) : null;
        if (!producto) {
          omitidos += 1;
          continue;
        }
        // Extras: se re-validan contra el catálogo actual del producto
        let extras: { id: number; name: string; price: number }[] = [];
        const idsSnapshot = (item.extras || []).map((e) => e.id).filter((id): id is number => id != null);
        if (idsSnapshot.length > 0) {
          try {
            const extrasRes = await apiService.getExtras(producto.id);
            extras = extrasRes.data
              .filter((e) => idsSnapshot.includes(e.id))
              .map((e) => ({ id: e.id, name: e.name, price: Number(e.price) }));
          } catch {
            extras = [];
          }
        }
        const precioUnit = Number(producto.price) + extras.reduce((s, e) => s + e.price, 0);
        for (let i = 0; i < item.quantity; i++) {
          addToCart({
            menuItemId: Number(producto.id),
            name: producto.name,
            price: precioUnit,
            image: producto.image || '',
            extras: extras.length > 0 ? extras : undefined,
          });
        }
        agregados += 1;
      }

      if (agregados === 0) {
        toast.error('Ninguno de esos productos sigue disponible en el menú');
        return;
      }
      if (omitidos > 0) {
        toast(`${omitidos} producto(s) ya no están disponibles y se omitieron`, { icon: 'ℹ️' });
      }
      toast.success('¡Tu pedido está en el carrito!');
      router.push('/pedidos');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo rearmar el pedido');
    } finally {
      setReordenando(null);
    }
  };

  if (!cargado) return null;

  return (
    <>
      <Head>
        <title>Mi Cuenta - La Hamburguezona</title>
        <meta name="description" content="Consulta tus pedidos, tus puntos de lealtad y vuelve a pedir en un click." />
      </Head>

      <div className="bg-dark-900 text-white py-14">
        <div className="container-custom text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
          <h1 className="text-3xl md:text-4xl font-bold">Mi Cuenta</h1>
          <p className="text-gray-400 mt-2">Tus pedidos, tus puntos y recompra en un click</p>
        </div>
      </div>

      <div className="container-custom section-padding max-w-3xl">
        {!sesion ? (
          /* Acceso: mismos datos que el cliente deja al pedir */
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Accede a tu cuenta</h2>
            <p className="text-sm text-gray-500 mb-6">
              Usa el email y teléfono con los que haces tus pedidos. Tu cuenta se crea
              automáticamente con tu primer pedido.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (10 dígitos)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAcceso()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="2281234567"
                />
              </div>
              {errorAcceso && <p className="text-sm text-red-600">{errorAcceso}</p>}
              <button
                onClick={handleAcceso}
                disabled={accediendo}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {accediendo ? 'Verificando...' : 'Ver mis pedidos y puntos'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Encabezado de cuenta + puntos */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">¡Hola, {sesion.customer.name.split(' ')[0]}!</h2>
                <p className="text-sm text-gray-500">{sesion.customer.email} · {sesion.customer.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-secondary-50 border border-secondary-200 rounded-xl px-5 py-3">
                  <Star className="w-6 h-6 text-secondary-500 fill-secondary-400" />
                  <div>
                    <p className="text-2xl font-bold text-secondary-700 leading-none">{sesion.customer.loyalty_points}</p>
                    <p className="text-xs text-secondary-600">puntos (valen ${sesion.customer.loyalty_points})</p>
                  </div>
                </div>
                <button
                  onClick={handleSalir}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Ganas 1 punto por cada $10 de compra entregada, y los canjeas como descuento al pagar. 🍔
            </p>

            {/* Historial de pedidos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mis pedidos</h3>
              {cargandoPedidos ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : pedidos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aún no tienes pedidos con este email. ¡Haz el primero desde el menú!
                </p>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((p) => {
                    const est = ESTADOS[p.status] || { label: p.status, cls: 'bg-gray-100 text-gray-700' };
                    return (
                      <div key={p.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">#{p.order_number}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${est.cls}`}>{est.label}</span>
                            {p.scheduled_for && (
                              <span className="flex items-center gap-1 text-xs text-orange-600">
                                <Clock className="w-3 h-3" />
                                {new Date(p.scheduled_for).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {new Date(p.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {p.items.map((i) => `${i.quantity}x ${i.menu_item_name}`).join(' · ')}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary-500">{money(p.total_amount)}</span>
                          <button
                            onClick={() => volverAPedir(p)}
                            disabled={reordenando !== null}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
                          >
                            <RotateCcw className={`w-4 h-4 ${reordenando === String(p.id) ? 'animate-spin' : ''}`} />
                            {reordenando === String(p.id) ? 'Armando...' : 'Volver a pedir'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MiCuentaPage;
