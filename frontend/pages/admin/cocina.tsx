import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { playNewOrderSound } from '../../utils/orderAlerts';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import type { Order, MenuItem } from '../../services/api';
import { Clock, Users, ChefHat, CheckCircle, Eye, AlertCircle, Package } from 'lucide-react';

interface KitchenStats {
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_today: number;
  avg_prep_time: number;
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing'];

// Minutos antes de su hora en que un pedido programado se "activa" en la cola de cocina
const MINUTOS_ACTIVACION = 40;

const CocinaDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<KitchenStats>({
    pending_orders: 0,
    confirmed_orders: 0,
    in_progress_orders: 0,
    completed_today: 0,
    avg_prep_time: 0
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Order['id'] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchMenuItems();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // IDs de pedidos ya vistos; null hasta la primera carga para no sonar al entrar
  const seenOrderIdsRef = useRef<Set<string> | null>(null);

  // Reloj interno: re-evalúa cada 30s si algún programado ya debe activarse
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Programado "lejano": aún no le toca a cocina (falta más del margen de activación)
  const esProgramadoLejano = (o: Order) =>
    !!o.scheduled_for &&
    new Date(o.scheduled_for).getTime() - ahora > MINUTOS_ACTIVACION * 60 * 1000 &&
    ['pending', 'confirmed'].includes(o.status);

  const activos = orders.filter((o) => !esProgramadoLejano(o));
  const programados = orders
    .filter(esProgramadoLejano)
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime());

  const faltante = (o: Order) => {
    const ms = new Date(o.scheduled_for!).getTime() - ahora;
    const totalMin = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  // Alerta de activación: suena una vez cuando un programado cruza el umbral
  const activacionAlertadaRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const activables = orders.filter(
      (o) => o.scheduled_for && !esProgramadoLejano(o) && ACTIVE_STATUSES.includes(o.status)
    );
    if (activacionAlertadaRef.current === null) {
      // Primera carga: baseline silencioso para no sonar al abrir la página
      activacionAlertadaRef.current = new Set(activables.map((o) => String(o.id)));
      return;
    }
    for (const o of activables) {
      if (!activacionAlertadaRef.current.has(String(o.id))) {
        activacionAlertadaRef.current.add(String(o.id));
        playNewOrderSound();
        toast(
          `⏰ Pedido programado ${o.order_number} entra a cocina — entrega a las ${new Date(o.scheduled_for!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          { icon: '🔔', duration: 10000 }
        );
      }
    }
  }, [orders, ahora]);

  const fetchOrders = async () => {
    try {
      const response = await apiService.getOrders();
      const active = response.data.filter(o => ACTIVE_STATUSES.includes(o.status));

      const previous = seenOrderIdsRef.current;
      if (previous !== null) {
        const nuevos = active.filter(o => !previous.has(String(o.id)));
        if (nuevos.length > 0) {
          playNewOrderSound();
          for (const pedido of nuevos) {
            const esProgramado =
              pedido.scheduled_for &&
              new Date(pedido.scheduled_for).getTime() - Date.now() > MINUTOS_ACTIVACION * 60 * 1000;
            if (esProgramado) {
              toast(
                `📅 Pedido programado ${pedido.order_number} para ${new Date(pedido.scheduled_for!).toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} — se activará solo ${MINUTOS_ACTIVACION} min antes`,
                { icon: '⏰', duration: 10000 }
              );
            } else {
              toast.success(`Nuevo pedido ${pedido.order_number} de ${pedido.customer_name}`, {
                icon: '🔔',
                duration: 8000,
              });
              // Evita que la alerta de activación vuelva a sonar para este pedido
              activacionAlertadaRef.current?.add(String(pedido.id));
            }
          }
        }
      }
      seenOrderIdsRef.current = new Set(active.map(o => String(o.id)));

      setOrders(active);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getReport('cocina');
      setStats(response.data as KitchenStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await apiService.getMenuItems();
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const getMenuItemById = (menuItemId: string | null) => {
    return menuItems.find(item => item.id === menuItemId);
  };

  const updateOrderStatus = async (orderId: Order['id'], newStatus: string) => {
    setUpdating(orderId);
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      await fetchStats();

      if (newStatus === 'ready') {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado del pedido');
    } finally {
      setUpdating(null);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      default: return status;
    }
  };

  const getPriorityColor = (order: Order) => {
    // Programados: la urgencia se mide contra SU hora de entrega, no contra
    // cuándo se creó el pedido (pudo crearse días antes)
    if (order.scheduled_for) {
      const minutosParaEntrega = (new Date(order.scheduled_for).getTime() - ahora) / 60000;
      if (minutosParaEntrega < 0) return 'border-red-500 bg-red-50 shadow-red-200';
      if (minutosParaEntrega < 15) return 'border-orange-400 bg-orange-50 shadow-orange-200';
      return 'border-gray-200 bg-white shadow-gray-200';
    }

    const createdAt = new Date(order.created_at);
    const diffMinutes = (ahora - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 30) return 'border-red-500 bg-red-50 shadow-red-200';
    if (diffMinutes > 15) return 'border-orange-400 bg-orange-50 shadow-orange-200';
    return 'border-gray-200 bg-white shadow-gray-200';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Cocina - La Hamburguezona Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChefHat className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cocina</h1>
              <p className="text-gray-600">Gestión de pedidos y preparación</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed_orders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ChefHat className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Preparación</p>
                <p className="text-2xl font-bold text-gray-900">{stats.in_progress_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completados Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avg_prep_time)}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pedidos Activos</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Pendiente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Confirmado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Preparando</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Listo</span>
              </div>
            </div>
          </div>

          {activos.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos activos</h3>
              <p className="text-gray-500">Los nuevos pedidos aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activos.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getPriorityColor(order)}`}
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-lg font-bold">
                        #{order.order_number}
                      </div>
                      {order.scheduled_for && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                          ⏰ {new Date(order.scheduled_for).toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 font-medium">
                        {formatTime(order.created_at)}
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex items-center text-red-600 text-xs mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          <span className="font-semibold">Urgente</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">{order.customer_name}</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      📞 {order.customer_phone}
                    </div>
                    {order.delivery_address && (
                      <div className="text-sm text-gray-600 ml-6 mt-1">
                        📍 {order.delivery_address}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-orange-500" />
                      Productos:
                    </div>
                    <div className="space-y-2">
                      {order.items && order.items.slice(0, 3).map((item, index) => {
                        const menuItem = getMenuItemById(item.menu_item_id);
                        return (
                          <div key={index} className="flex justify-between items-start p-2 bg-white rounded-lg border">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {item.quantity}x {menuItem ? menuItem.name : `Producto ${item.menu_item_id}`}
                              </span>
                              {(item.extras || []).length > 0 && (
                                <p className="text-xs text-primary-600 font-semibold">
                                  {(item.extras || []).map((e) => `+ ${e.name}`).join(' · ')}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-orange-600">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        );
                      })}
                      {order.items && order.items.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          +{order.items.length - 3} productos más
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.delivery_instructions && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-xs font-medium text-yellow-800 mb-1">📝 Instrucciones especiales:</div>
                      <div className="text-sm text-yellow-700">{order.delivery_instructions}</div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-xl text-orange-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openOrderDetail(order)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detalles</span>
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        disabled={updating === order.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmar</span>
                      </button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={updating === order.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Iniciar</span>
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={updating === order.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Listo</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pedidos programados en espera: entran solos a la cola activa
              (con sonido) cuando falten MINUTOS_ACTIVACION para su hora */}
          {programados.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  Programados para después ({programados.length})
                </h2>
                <span className="text-xs text-gray-500">
                  · se activan solos {MINUTOS_ACTIVACION} min antes de su hora
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programados.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-white border border-orange-300 text-orange-700 px-3 py-1 rounded-full font-bold">
                        #{order.order_number}
                      </div>
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                        ⏳ faltan {faltante(order)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ⏰ {new Date(order.scheduled_for!).toLocaleString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.customer_name} · {order.items?.length || 0} producto(s) · {formatCurrency(order.total_amount)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openOrderDetail(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Detalles
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          disabled={updating === order.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pedido #{selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Información del Cliente</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 text-gray-400">📞</span>
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{formatTime(selectedOrder.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Estado del Pedido</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: <span className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Productos del Pedido</h4>
                  <div className="space-y-4">
                    {selectedOrder.items && selectedOrder.items.map((item, index) => {
                      const menuItem = getMenuItemById(item.menu_item_id);
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex gap-4 mb-3">
                            {/* Imagen del producto */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                                {menuItem && menuItem.image ? (
                                  <img 
                                    src={menuItem.image} 
                                    alt={menuItem.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: menuItem && menuItem.image ? 'none' : 'flex'}}>
                                  <ChefHat className="w-8 h-8" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Información del producto */}
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-lg">
                                {menuItem ? menuItem.name : `Producto ${item.menu_item_id}`}
                              </h5>
                              {menuItem && menuItem.description && (
                                <p className="text-sm text-gray-600 mt-1">{menuItem.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                  Cantidad: {item.quantity}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                  Precio: {formatCurrency(item.unit_price)}
                                </span>
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                                  Total: {formatCurrency(item.total_price)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {menuItem && menuItem.ingredients && menuItem.ingredients.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Package className="w-4 h-4 mr-2" />
                                Ingredientes:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {menuItem.ingredients.map((ingredient: string, idx: number) => (
                                  <span 
                                    key={idx} 
                                    className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 shadow-sm"
                                  >
                                    {ingredient}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {item.special_instructions && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="text-sm font-medium text-yellow-800 mb-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Instrucciones especiales:
                              </div>
                              <div className="text-sm text-yellow-700">{item.special_instructions}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.notes && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Instrucciones Generales del Pedido</h4>
                    <p className="text-blue-800">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      disabled={updating === selectedOrder.id}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar Pedido</span>
                    </button>
                  )}
                  
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      disabled={updating === selectedOrder.id}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Iniciar Preparación</span>
                    </button>
                  )}
                  
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      disabled={updating === selectedOrder.id}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Marcar como Listo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default withAuth(CocinaDashboard, 'COCINA');