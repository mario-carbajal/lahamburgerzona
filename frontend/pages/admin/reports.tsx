import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/Admin/AdminLayout';
import apiService from '../../services/api';
import type { InsumosReport } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Boxes,
  Trash2
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
  sales_by_category: Array<{
    category: string;
    items_sold: number;
    revenue: number;
  }>;
  weekly_sales: Array<{
    date: string;
    orders_count: number;
    revenue: number;
  }>;
  top_products: Array<{
    name: string;
    category: string;
    total_sold: number;
    revenue: number;
  }>;
  comparativa: {
    ventas_semana_actual: number;
    ventas_semana_anterior: number;
    pedidos_semana_actual: number;
    pedidos_semana_anterior: number;
    ventas_mes_actual: number;
    ventas_mes_anterior: number;
    cambio_ventas_semana_pct: number | null;
    cambio_pedidos_semana_pct: number | null;
    cambio_ventas_mes_pct: number | null;
  };
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

  const [insumosData, setInsumosData] = useState<InsumosReport | null>(null);
  const [insumosDias, setInsumosDias] = useState(30);

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesData();
    } else if (activeTab === 'customers') {
      loadCustomersData();
    } else if (activeTab === 'products') {
      loadProductsData();
    } else if (activeTab === 'insumos') {
      loadInsumosData(insumosDias);
    }
  }, [activeTab, insumosDias]);

  const loadInsumosData = async (dias: number) => {
    try {
      const response = await apiService.getInsumosReport(dias);
      setInsumosData(response.data);
    } catch (error) {
      console.error('Error loading insumos data:', error);
    }
  };

  // ── Exportación ─────────────────────────────────────────

  const [showExportMenu, setShowExportMenu] = useState(false);

  const datosDeTabActiva = (): { nombre: string; data: any } | null => {
    switch (activeTab) {
      case 'dashboard': return dashboardData ? { nombre: 'dashboard', data: dashboardData } : null;
      case 'sales': return salesData ? { nombre: 'ventas', data: salesData } : null;
      case 'customers': return customersData ? { nombre: 'clientes', data: customersData } : null;
      case 'products': return productsData ? { nombre: 'productos', data: productsData } : null;
      case 'insumos': return insumosData ? { nombre: `insumos-${insumosDias}dias`, data: insumosData } : null;
      default: return null;
    }
  };

  // Convierte el objeto del reporte en hojas: cada array de objetos es una hoja,
  // cada sub-objeto es una hoja de una fila, y los valores sueltos van a "Resumen".
  const exportarExcel = () => {
    const activo = datosDeTabActiva();
    if (!activo) {
      alert('Espera a que carguen los datos del reporte');
      return;
    }
    const wb = XLSX.utils.book_new();
    const usados = new Set<string>();
    const agregarHoja = (nombre: string, filas: any[]) => {
      if (!filas || filas.length === 0) return;
      let hoja = nombre.replace(/_/g, ' ').slice(0, 31);
      while (usados.has(hoja)) hoja = `${hoja.slice(0, 28)}_2`;
      usados.add(hoja);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), hoja);
    };

    const sueltos: Record<string, any> = {};
    Object.entries(activo.data as Record<string, any>).forEach(([clave, valor]) => {
      if (Array.isArray(valor) && valor.length > 0 && typeof valor[0] === 'object') {
        agregarHoja(clave, valor);
      } else if (valor && typeof valor === 'object') {
        agregarHoja(clave, [valor]);
      } else {
        sueltos[clave] = valor;
      }
    });
    if (Object.keys(sueltos).length > 0) agregarHoja('Resumen', [sueltos]);

    if (usados.size === 0) {
      alert('Este reporte no tiene datos para exportar');
      return;
    }
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `hamburguezona-${activo.nombre}-${fecha}.xlsx`);
    setShowExportMenu(false);
  };

  const exportarPDF = () => {
    // Vista imprimible del tab activo: el diálogo del navegador permite "Guardar como PDF"
    setShowExportMenu(false);
    setTimeout(() => window.print(), 100);
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getReport('dashboard');
      setDashboardData(response.data as DashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesData = async () => {
    try {
      const response = await apiService.getReport('ventas');
      setSalesData(response.data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadCustomersData = async () => {
    try {
      const response = await apiService.getReport('clientes');
      setCustomersData(response.data);
    } catch (error) {
      console.error('Error loading customers data:', error);
    }
  };

  const loadProductsData = async () => {
    try {
      const response = await apiService.getReport('productos');
      setProductsData(response.data);
    } catch (error) {
      console.error('Error loading products data:', error);
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

  const ComparisonCard = ({ title, current, previous, changePct, formatValue }: {
    title: string;
    current: number;
    previous: number;
    changePct: number | null;
    formatValue: (v: number) => string;
  }) => {
    const isUp = (changePct ?? 0) >= 0;
    const noPreviousData = previous === 0 && current === 0;
    return (
      <div className="border border-gray-100 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-gray-900">{formatValue(current)}</p>
          {!noPreviousData && changePct !== null && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(changePct)}%
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {noPreviousData
            ? 'Sin datos del período anterior'
            : `Período anterior: ${formatValue(previous)}`}
        </p>
      </div>
    );
  };

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
          <div className="flex space-x-3 print:hidden">
            <button
              onClick={loadDashboardData}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <button
                    onClick={exportarExcel}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    PDF (imprimir / guardar)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Encabezado solo para impresión / PDF */}
        <div className="hidden print:block border-b border-gray-300 pb-3">
          <p className="text-lg font-bold">La Hamburguezona — Reporte de {activeTab === 'sales' ? 'ventas' : activeTab === 'customers' ? 'clientes' : activeTab === 'products' ? 'productos' : activeTab === 'insumos' ? 'insumos' : 'dashboard'}</p>
          <p className="text-sm text-gray-600">Generado el {new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 print:hidden">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'sales', name: 'Ventas', icon: DollarSign },
              { id: 'customers', name: 'Clientes', icon: Users },
              { id: 'products', name: 'Productos', icon: Package },
              { id: 'insumos', name: 'Insumos', icon: Boxes }
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

            {/* Comparativa histórica */}
            {dashboardData.comparativa && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comparativa con el Período Anterior
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ComparisonCard
                    title="Ventas — Últimos 7 días"
                    current={dashboardData.comparativa.ventas_semana_actual}
                    previous={dashboardData.comparativa.ventas_semana_anterior}
                    changePct={dashboardData.comparativa.cambio_ventas_semana_pct}
                    formatValue={formatCurrency}
                  />
                  <ComparisonCard
                    title="Pedidos — Últimos 7 días"
                    current={dashboardData.comparativa.pedidos_semana_actual}
                    previous={dashboardData.comparativa.pedidos_semana_anterior}
                    changePct={dashboardData.comparativa.cambio_pedidos_semana_pct}
                    formatValue={(v) => String(v)}
                  />
                  <ComparisonCard
                    title="Ventas — Últimos 30 días"
                    current={dashboardData.comparativa.ventas_mes_actual}
                    previous={dashboardData.comparativa.ventas_mes_anterior}
                    changePct={dashboardData.comparativa.cambio_ventas_mes_pct}
                    formatValue={formatCurrency}
                  />
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Category */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ventas por Categoría
                </h3>
                <div className="space-y-3">
                  {dashboardData.sales_by_category.slice(0, 5).map((category, index) => (
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
                  {dashboardData.top_products.slice(0, 5).map((product, index) => (
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
                {dashboardData.weekly_sales.map((day, index) => (
                  <div key={day.date} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-3 mb-2">
                      <div 
                        className="bg-primary-500 rounded"
                        style={{ 
                          height: `${Math.max(20, (day.revenue / Math.max(...dashboardData.weekly_sales.map(d => d.revenue), 1)) * 100)}px` 
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
                    value={formatCurrency(salesData.performance.total_revenue)}
                    icon={DollarSign}
                    color="bg-green-500"
                    subtitle={`${salesData.performance.total_orders} pedidos`}
                  />
                  <StatCard
                    title="Valor Promedio"
                    value={formatCurrency(salesData.performance.avg_order_value)}
                    icon={TrendingUp}
                    color="bg-blue-500"
                    subtitle="Por pedido"
                  />
                  <StatCard
                    title="Tasa de Éxito"
                    value={`${formatNumber(salesData.performance.success_rate, 1)}%`}
                    icon={BarChart3}
                    color="bg-purple-500"
                    subtitle={`${salesData.performance.successful_orders} exitosos`}
                  />
                  <StatCard
                    title="Pedidos Cancelados"
                    value={salesData.performance.cancelled_orders}
                    icon={ShoppingCart}
                    color="bg-red-500"
                    subtitle={`${salesData.performance.success_rate}% éxito`}
                  />
                </div>

                {/* Sales by Category */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ventas por Categoría
                  </h3>
                  <div className="space-y-3">
                    {salesData.sales_by_category.map((category: any, index: number) => (
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
                    {customersData.top_customers.slice(0, 10).map((customer: any, index: number) => (
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
                    {productsData.top_selling_products.slice(0, 10).map((product: any, index: number) => (
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
                    {productsData.category_performance.map((category: any, index: number) => (
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
                {productsData.products_no_sales.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Productos Sin Ventas
                    </h3>
                    <div className="space-y-2">
                      {productsData.products_no_sales.map((product: any) => (
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

        {/* Insumos Tab */}
        {activeTab === 'insumos' && (
          <div className="space-y-6">
            {/* Selector de período */}
            <div className="flex items-center gap-2 print:hidden">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setInsumosDias(d)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    insumosDias === d
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  Últimos {d} días
                </button>
              ))}
            </div>

            {insumosData ? (
              <>
                {/* Totales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500">Consumo (cocina)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(insumosData.totales.consumo_valor)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-gray-500">Merma (desperdicio)</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(insumosData.totales.merma_valor)}</p>
                    <p className="text-xs text-gray-500 mt-1">{insumosData.totales.merma_pct}% de lo que salió</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500">Compras del período</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(insumosData.totales.compras_valor)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500">Inventario actual</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(insumosData.totales.inventario_actual_valor)}</p>
                  </div>
                </div>

                {/* Detalle por insumo */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Movimiento por Insumo — últimos {insumosData.dias} días
                  </h3>
                  {insumosData.por_insumo.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">
                      Sin movimientos de insumos en el período.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100">
                            <th className="px-3 py-2 font-medium">Insumo</th>
                            <th className="px-3 py-2 font-medium text-right">Consumo</th>
                            <th className="px-3 py-2 font-medium text-right">Merma</th>
                            <th className="px-3 py-2 font-medium text-right">Entradas</th>
                            <th className="px-3 py-2 font-medium text-right">Consumo $</th>
                            <th className="px-3 py-2 font-medium text-right">Merma $</th>
                            <th className="px-3 py-2 font-medium text-right">Compras $</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insumosData.por_insumo.map((r) => (
                            <tr key={r.id} className="border-b border-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                              <td className="px-3 py-2 text-right">{parseFloat(r.consumo)} {r.unit}</td>
                              <td className={`px-3 py-2 text-right ${parseFloat(r.merma) > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                {parseFloat(r.merma)} {r.unit}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">{parseFloat(r.entradas)} {r.unit}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(r.consumo_valor)}</td>
                              <td className={`px-3 py-2 text-right ${parseFloat(r.merma_valor) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {formatCurrency(r.merma_valor)}
                              </td>
                              <td className="px-3 py-2 text-right">{formatCurrency(r.compras_valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando datos de insumos...</p>
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