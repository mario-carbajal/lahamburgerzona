import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
// Removed apiGet import - using fetch directly like orders page
import { withAuth } from '../../middleware/auth';
import { 
  ShoppingCart, 
  Users, 
  Star, 
  TrendingUp, 
  Clock,
  DollarSign,
  Package,
  MessageSquare,
  Eye
} from 'lucide-react';

interface DashboardData {
  orders: {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
    today_orders: number;
    today_revenue: number;
  };
  revenue: {
    total_revenue: number;
    delivered_revenue: number;
    avg_order_value: number;
  };
  customers: {
    total_customers: number;
    new_customers_month: number;
    new_customers_week: number;
  };
  menu: {
    total_items: number;
    active_items: number;
    popular_items: number;
  };
  reviews: {
    total_reviews: number;
    avg_rating: number;
    positive_reviews: number;
  };
  weeklySales: any[];
  topProducts: any[];
}

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar datos del dashboard
        const dashboardResponse = await fetch('/api/reports/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult.data);

        // Cargar pedidos recientes
        const ordersResponse = await fetch('/api/orders?limit=5', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const ordersResult = await ordersResponse.json();
        
        // Tomar los últimos 5 pedidos
        const recent = ordersResult.data.slice(0, 5).map((order: any) => ({
          id: order.id,
          customer_name: order.customer_name || 'Cliente',
          customer_email: order.customer_email || '',
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
          items_count: order.items ? order.items.length : 0
        }));
        setRecentOrders(recent);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const statCards = dashboardData ? [
    {
      title: 'Pedidos Totales',
      value: dashboardData.orders.total_orders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: `${dashboardData.orders.today_orders} hoy`,
      subtitle: `${dashboardData.orders.completed_orders} entregados`
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(dashboardData.revenue.total_revenue),
      icon: DollarSign,
      color: 'bg-green-500',
      change: formatCurrency(dashboardData.orders.today_revenue),
      subtitle: 'Hoy'
    },
    {
      title: 'Ventas Entregadas',
      value: formatCurrency(dashboardData.revenue.delivered_revenue),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      change: `${dashboardData.orders.completed_orders} pedidos entregados`,
      subtitle: `${Math.round((dashboardData.orders.completed_orders / dashboardData.orders.total_orders) * 100)}% éxito`
    },
    {
      title: 'Clientes',
      value: dashboardData.customers.total_customers.toString(),
      icon: Users,
      color: 'bg-purple-500',
      change: `${dashboardData.customers.new_customers_week} esta semana`,
      subtitle: `${dashboardData.customers.new_customers_month} este mes`
    },
    {
      title: 'Calificación Promedio',
      value: dashboardData.reviews.avg_rating ? Number(dashboardData.reviews.avg_rating).toFixed(1) : '0.0',
      icon: Star,
      color: 'bg-yellow-500',
      change: `${dashboardData.reviews.positive_reviews} positivas`,
      subtitle: `${dashboardData.reviews.total_reviews} reseñas`
    },
    {
      title: 'Pedidos Pendientes',
      value: dashboardData.orders.pending_orders.toString(),
      icon: Clock,
      color: 'bg-orange-500',
      change: 'Requieren atención',
      subtitle: `${dashboardData.orders.cancelled_orders} cancelados`
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleViewOrder = (orderId: string) => {
    window.location.href = `/admin/orders?view=${orderId}`;
  };

  const handleMarkOrdersDelivered = async () => {
    try {
      const response = await fetch('/api/orders/test/mark-delivered', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Recargar datos del dashboard
        window.location.reload();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking orders as delivered:', error);
      alert('❌ Error al marcar pedidos como entregados');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="ml-3 text-gray-600">Cargando dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Dashboard - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Resumen general del negocio</p>
          </div>
          <div className="flex space-x-3">
            {/* Botón de prueba oculto - cambiar 'hidden' por 'block' si necesitas generar datos de prueba */}
            <button
              onClick={handleMarkOrdersDelivered}
              className="hidden bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Botón de prueba - oculto por defecto"
            >
              📦 Marcar Pedidos como Entregados (Test)
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1 font-medium">{stat.change}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pedidos Recientes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">#{order.id}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">{order.items_count} items • {formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{formatTimeAgo(order.created_at)}</p>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay pedidos recientes</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => window.location.href = '/admin/orders'}
                  className="w-full btn-primary"
                >
                  Ver Todos los Pedidos
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => window.location.href = '/admin/orders'}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">Ver Pedidos</p>
                </button>
                <button 
                  onClick={() => window.location.href = '/admin/menu'}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                >
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Gestionar Menú</p>
                </button>
                <button 
                  onClick={() => window.location.href = '/admin/customers'}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                >
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-900">Ver Clientes</p>
                </button>
                <button 
                  onClick={() => window.location.href = '/admin/reports'}
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                >
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-900">Reportes</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Ventas de la Última Semana</h2>
            <p className="text-sm text-gray-600 mt-1">Ingresos por día</p>
          </div>
          <div className="p-6">
            {dashboardData && dashboardData.weeklySales && dashboardData.weeklySales.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.weeklySales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(sale.date).toLocaleDateString('es-MX', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{sale.orders_count} pedidos ({sale.delivered_orders || 0} entregados)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.revenue)}</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((sale.revenue / Math.max(...dashboardData.weeklySales.map(s => s.revenue))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay datos de ventas</p>
                  <p className="text-sm text-gray-400">Los datos aparecerán cuando haya pedidos entregados</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        {dashboardData && dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Productos Más Vendidos</h2>
              <p className="text-sm text-gray-600 mt-1">Top 5 productos entregados</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{product.total_sold} vendidos</p>
                      <p className="text-sm text-gray-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminDashboard);


