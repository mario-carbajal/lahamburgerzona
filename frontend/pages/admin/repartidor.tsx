import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, Users, Navigation } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import type { Order } from '../../services/api';

interface DeliveryStats {
  ready_orders: number;
  delivered_today: number;
  avg_delivery_time: number;
}

const RepartidorPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DeliveryStats>({
    ready_orders: 0,
    delivered_today: 0,
    avg_delivery_time: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getOrders({ estado: 'ready' });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getReport('entregas');
      setStats(response.data as DeliveryStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: Order['id'], newStatus: string) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Listo para Entrega';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };

  const statCards = [
    {
      title: 'Listos para Entrega',
      value: stats.ready_orders,
      icon: Clock,
      color: 'bg-green-500',
      change: 'Esperando repartidor'
    },
    {
      title: 'Entregados Hoy',
      value: stats.delivered_today,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: 'Completados exitosamente'
    },
    {
      title: 'Tiempo Promedio',
      value: `${Math.round(stats.avg_delivery_time)} min`,
      icon: Navigation,
      color: 'bg-orange-500',
      change: 'Tiempo de entrega'
    }
  ];

  return (
    <>
      <Head>
        <title>Repartidor - La Hamburguezona Admin</title>
        <meta name="description" content="Panel de repartidor - La Hamburguezona" />
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Truck className="w-8 h-8 text-blue-500" />
                <span>Repartidor</span>
              </h1>
              <p className="text-gray-600 mt-1">Gestiona las entregas y rutas</p>
            </div>
            <button
              onClick={fetchOrders}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Actualizar
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Entregas Activas</h2>
              <p className="text-gray-600 mt-1">Gestiona el estado de las entregas</p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando entregas...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay entregas activas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Pedido #{order.id}
                            </h3>
                            <p className="text-gray-600">
                              {order.customer_name} • {order.total_amount ? `$${order.total_amount}` : 'Pendiente'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        {/* Delivery Info */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Dirección</p>
                              <p className="text-sm text-gray-600">{order.delivery_address || 'No especificada'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Cliente</p>
                              <p className="text-sm text-gray-600">{order.customer_phone || 'No especificado'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {order.items && order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.menu_item_name}
                                </span>
                                <span className="text-gray-500">
                                  ${item.total_price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-6">
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Marcar Entregado
                          </button>
                        )}
                        <button
                          onClick={() => {/* Ver ruta en mapa */}}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver Ruta
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default withAuth(RepartidorPage, 'REPARTIDOR');
