import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
// Removed apiGet import - using fetch directly like orders page
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  orders: {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
    today_revenue: number;
    today_orders: number;
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
  salesByCategory: Array<{
    category: string;
    items_sold: number;
    revenue: number;
  }>;
  weeklySales: Array<{
    date: string;
    orders_count: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    category: string;
    total_sold: number;
    revenue: number;
  }>;
}

const ReportsPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [customersData, setCustomersData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    period: 'month'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesData();
    } else if (activeTab === 'customers') {
      loadCustomersData();
    } else if (activeTab === 'products') {
      loadProductsData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reports/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
        console.log('Dashboard data loaded: success');
      } else {
        console.error('Error loading dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesData = async () => {
    try {
      const response = await fetch('/api/reports/sales', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSalesData(data.data);
        console.log('Sales data loaded: success');
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadCustomersData = async () => {
    try {
      const response = await fetch('/api/reports/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setCustomersData(data.data);
        console.log('Customers data loaded: success');
      }
    } catch (error) {
      console.error('Error loading customers data:', error);
    }
  };

  const loadProductsData = async () => {
    try {
      const response = await fetch('/api/reports/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setProductsData(data.data);
        console.log('Products data loaded: success');
      }
    } catch (error) {
      console.error('Error loading products data:', error);
    }
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
        loadDashboardData();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking orders as delivered:', error);
      alert('❌ Error al marcar pedidos como entregados');
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatNumber = (value: number | string | null, decimals: number = 1) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return numValue.toFixed(decimals);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <Head>
          <title>Reportes - La Hamburguezona Admin</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Reportes - La Hamburguezona Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600 mt-2">Estadísticas y métricas de tu negocio</p>
          </div>
          <div className="flex space-x-3">
            {/* Botón de prueba oculto - cambiar 'hidden' por 'block' si necesitas generar datos de prueba */}
            <button
              onClick={handleMarkOrdersDelivered}
              className="hidden bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              title="Botón de prueba - oculto por defecto"
            >
              <span>📦</span>
              <span>Marcar Entregados (Test)</span>
            </button>
            <button
              onClick={loadDashboardData}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'sales', name: 'Ventas', icon: DollarSign },
              { id: 'customers', name: 'Clientes', icon: Users },
              { id: 'products', name: 'Productos', icon: Package }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Ventas Totales"
                value={formatCurrency(dashboardData.revenue.total_revenue)}
                icon={DollarSign}
                color="bg-green-500"
                subtitle={`${dashboardData.orders.completed_orders} completados, ${dashboardData.orders.total_orders} total`}
              />
              <StatCard
                title="Pedidos Hoy"
                value={dashboardData.orders.today_orders}
                icon={ShoppingCart}
                color="bg-blue-500"
                subtitle={formatCurrency(dashboardData.orders.today_revenue)}
              />
              <StatCard
                title="Clientes Totales"
                value={dashboardData.customers.total_customers}
                icon={Users}
                color="bg-purple-500"
                subtitle={`${dashboardData.customers.new_customers_week} nuevos esta semana`}
              />
              <StatCard
                title="Valor Promedio"
                value={formatCurrency(dashboardData.revenue.avg_order_value)}
                icon={TrendingUp}
                color="bg-orange-500"
                subtitle="Por pedido completado"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Productos Activos"
                value={`${dashboardData.menu.active_items}/${dashboardData.menu.total_items}`}
                icon={Package}
                color="bg-indigo-500"
                subtitle={`${dashboardData.menu.popular_items} populares`}
              />
              <StatCard
                title="Ventas Entregadas"
                value={formatCurrency(dashboardData.revenue.delivered_revenue)}
                icon={TrendingUp}
                color="bg-emerald-500"
                subtitle={`${dashboardData.orders.completed_orders} pedidos entregados`}
              />
              <StatCard
                title="Reseñas Promedio"
                value={formatNumber(dashboardData.reviews.avg_rating, 1)}
                icon={Star}
                color="bg-yellow-500"
                subtitle={`${dashboardData.reviews.total_reviews} reseñas`}
              />
              <StatCard
                title="Pedidos Pendientes"
                value={dashboardData.orders.pending_orders}
                icon={Calendar}
                color="bg-red-500"
                subtitle={`${dashboardData.orders.cancelled_orders} cancelados`}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Category */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ventas por Categoría
                </h3>
                <div className="space-y-3">
                  {dashboardData.salesByCategory.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][index]
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {category.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.items_sold} items
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Productos Más Vendidos
                </h3>
                <div className="space-y-3">
                  {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-800 text-xs font-bold rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {product.total_sold} vendidos
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Sales Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ventas de la Última Semana
              </h3>
              <div className="grid grid-cols-7 gap-4">
                {dashboardData.weeklySales.map((day, index) => (
                  <div key={day.date} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-3 mb-2">
                      <div 
                        className="bg-primary-500 rounded"
                        style={{ 
                          height: `${Math.max(20, (day.revenue / Math.max(...dashboardData.weeklySales.map(d => d.revenue), 1)) * 100)}px` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('es-MX', { weekday: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(day.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {day.orders_count} pedidos
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {salesData ? (
              <>
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Ventas"
                    value={formatCurrency(salesData.performanceMetrics.total_revenue)}
                    icon={DollarSign}
                    color="bg-green-500"
                    subtitle={`${salesData.performanceMetrics.total_orders} pedidos`}
                  />
                  <StatCard
                    title="Valor Promedio"
                    value={formatCurrency(salesData.performanceMetrics.avg_order_value)}
                    icon={TrendingUp}
                    color="bg-blue-500"
                    subtitle="Por pedido"
                  />
                  <StatCard
                    title="Tasa de Éxito"
                    value={`${formatNumber(salesData.performanceMetrics.success_rate, 1)}%`}
                    icon={BarChart3}
                    color="bg-purple-500"
                    subtitle={`${salesData.performanceMetrics.successful_orders} exitosos`}
                  />
                  <StatCard
                    title="Pedidos Cancelados"
                    value={salesData.performanceMetrics.cancelled_orders}
                    icon={ShoppingCart}
                    color="bg-red-500"
                    subtitle={`${salesData.performanceMetrics.success_rate}% éxito`}
                  />
                </div>

                {/* Sales by Category */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ventas por Categoría
                  </h3>
                  <div className="space-y-3">
                    {salesData.salesByCategory.map((category: any, index: number) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][index % 5]
                          }`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {category.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(category.revenue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.items_sold} items vendidos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando datos de ventas...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {customersData ? (
              <>
                {/* Customer Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Clientes"
                    value={customersData.stats.total_customers}
                    icon={Users}
                    color="bg-blue-500"
                    subtitle="Clientes registrados"
                  />
                  <StatCard
                    title="Nuevos Este Mes"
                    value={customersData.stats.new_customers_month}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subtitle="Últimos 30 días"
                  />
                  <StatCard
                    title="Nuevos Esta Semana"
                    value={customersData.stats.new_customers_week}
                    icon={Calendar}
                    color="bg-purple-500"
                    subtitle="Últimos 7 días"
                  />
                  <StatCard
                    title="Nuevos Hoy"
                    value={customersData.stats.new_customers_today}
                    icon={Star}
                    color="bg-orange-500"
                    subtitle="Último día"
                  />
                </div>

                {/* Top Customers */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Clientes Más Activos
                  </h3>
                  <div className="space-y-3">
                    {customersData.topCustomers.slice(0, 10).map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-800 text-sm font-bold rounded-full">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(customer.total_spent)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {customer.total_orders} pedidos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Segmentation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Segmentación de Clientes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customersData.segmentation.map((segment: any, index: number) => (
                      <div key={segment.segment} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{segment.segment}</h4>
                          <span className="text-sm font-bold text-primary-600">{segment.customer_count}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Ingresos: {formatCurrency(segment.total_revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando datos de clientes...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {productsData ? (
              <>
                {/* Top Selling Products */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Productos Más Vendidos
                  </h3>
                  <div className="space-y-3">
                    {productsData.topSellingProducts.slice(0, 10).map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-800 text-sm font-bold rounded-full">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {product.total_quantity_sold} vendidos
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(product.total_revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rendimiento por Categoría
                  </h3>
                  <div className="space-y-3">
                    {productsData.categoryPerformance.map((category: any, index: number) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][index % 5]
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{category.category}</p>
                            <p className="text-xs text-gray-500">
                              {category.active_items}/{category.total_items} activos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(category.total_revenue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.total_sold} vendidos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products with No Sales */}
                {productsData.productsNoSales.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Productos Sin Ventas
                    </h3>
                    <div className="space-y-2">
                      {productsData.productsNoSales.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                          <span className="text-xs text-red-600 font-medium">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando datos de productos...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;