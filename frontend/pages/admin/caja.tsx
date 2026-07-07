import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CreditCard, DollarSign, Receipt, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import type { Order } from '../../services/api';

interface CashierStats {
  today_revenue: number;
  pending_payments: number;
  completed_payments: number;
  avg_order_value: number;
}

const CajaPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CashierStats>({
    today_revenue: 0,
    pending_payments: 0,
    completed_payments: 0,
    avg_order_value: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getReport('caja');
      setStats(response.data as CashierStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const statCards = [
    {
      title: 'Ingresos Hoy',
      value: formatCurrency(stats.today_revenue),
      icon: DollarSign,
      color: 'bg-green-500',
      change: 'Total del día'
    },
    {
      title: 'Pagos Pendientes',
      value: stats.pending_payments,
      icon: CreditCard,
      color: 'bg-yellow-500',
      change: 'Esperando confirmación'
    },
    {
      title: 'Pagos Completados',
      value: stats.completed_payments,
      icon: CheckCircle,
      color: 'bg-blue-500',
      change: 'Procesados exitosamente'
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(stats.avg_order_value),
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: 'Valor por pedido'
    }
  ];

  return (
    <>
      <Head>
        <title>Caja - La Hamburguezona Admin</title>
        <meta name="description" content="Panel de caja - La Hamburguezona" />
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-green-500" />
                <span>Caja</span>
              </h1>
              <p className="text-gray-600 mt-1">Gestiona pagos y facturación</p>
            </div>
            <button
              onClick={fetchOrders}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
              <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
              <p className="text-gray-600 mt-1">Gestiona pagos y facturas</p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando transacciones...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay transacciones</p>
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
                              {order.customer_name} • {formatCurrency(order.total_amount)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Método de Pago</p>
                              <p className="text-sm text-gray-600">{order.payment_method || 'Efectivo'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Cliente</p>
                              <p className="text-sm text-gray-600">{order.customer_email || 'No especificado'}</p>
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
                                  {formatCurrency(item.total_price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => {/* Generar factura */}}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Receipt className="w-4 h-4 inline mr-1" />
                          Factura
                        </button>
                        <button
                          onClick={() => {/* Ver detalles */}}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver Detalles
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

export default withAuth(CajaPage, 'CAJA');
