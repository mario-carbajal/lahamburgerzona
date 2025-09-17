import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  ShoppingCart, 
  Users, 
  Star, 
  TrendingUp, 
  Clock,
  DollarSign,
  Package,
  MessageSquare
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageRating: number;
  pendingOrders: number;
  totalProducts: number;
  newMessages: number;
  monthlyGrowth: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageRating: 0,
    pendingOrders: 0,
    totalProducts: 0,
    newMessages: 0,
    monthlyGrowth: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadDashboardData = async () => {
      try {
        // TODO: Reemplazar con llamadas reales a la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalOrders: 1247,
          totalRevenue: 45680,
          totalCustomers: 892,
          averageRating: 4.8,
          pendingOrders: 23,
          totalProducts: 45,
          newMessages: 12,
          monthlyGrowth: 15.3,
        });

        setRecentOrders([
          {
            id: 'ORD-001',
            customer: 'María González',
            items: 3,
            total: 540,
            status: 'pending',
            time: '10 min ago'
          },
          {
            id: 'ORD-002',
            customer: 'Carlos Ruiz',
            items: 2,
            total: 380,
            status: 'preparing',
            time: '25 min ago'
          },
          {
            id: 'ORD-003',
            customer: 'Ana Martínez',
            items: 4,
            total: 720,
            status: 'delivered',
            time: '1 hour ago'
          },
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Pedidos Totales',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: `+${stats.monthlyGrowth}%`
    },
    {
      title: 'Ingresos Totales',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: `+${stats.monthlyGrowth}%`
    },
    {
      title: 'Clientes',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-purple-500',
      change: `+${stats.monthlyGrowth}%`
    },
    {
      title: 'Calificación Promedio',
      value: stats.averageRating,
      icon: Star,
      color: 'bg-yellow-500',
      change: `${stats.averageRating}/5`
    },
    {
      title: 'Pedidos Pendientes',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-orange-500',
      change: 'Requieren atención'
    },
    {
      title: 'Productos en Menú',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-indigo-500',
      change: 'Activos'
    },
  ];

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
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Resumen general del negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
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
                {recentOrders.map((order: any, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">#{order.id}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.items} items • ${order.total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{order.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="w-full btn-primary">
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
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                  <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">Nuevo Pedido</p>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Agregar Producto</p>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-900">Ver Clientes</p>
                </button>
                <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200">
                  <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-900">Mensajes</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Crecimiento Mensual</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de crecimiento</p>
                <p className="text-sm text-gray-400">Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

