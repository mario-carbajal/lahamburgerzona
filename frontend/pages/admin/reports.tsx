import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface ReportData {
  sales: {
    total: number;
    growth: number;
    period: string;
    daily: Array<{
      date: string;
      amount: number;
    }>;
  };
  orders: {
    total: number;
    growth: number;
    period: string;
    byStatus: {
      pending: number;
      preparing: number;
      delivered: number;
      cancelled: number;
    };
  };
  products: {
    topSelling: Array<{
      name: string;
      sales: number;
    }>;
  };
  customers: {
    total: number;
    newCustomers: number;
    returningCustomers: number;
  };
}

const AdminReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      // TODO: Reemplazar con llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: ReportData = {
        sales: {
          total: 45680,
          growth: 15.3,
          period: selectedPeriod === 'week' ? 'Esta semana' : selectedPeriod === 'month' ? 'Este mes' : 'Este año',
          daily: [
            { date: '2025-09-01', amount: 1200 },
            { date: '2025-09-02', amount: 1450 },
            { date: '2025-09-03', amount: 1100 },
            { date: '2025-09-04', amount: 1800 },
            { date: '2025-09-05', amount: 2200 },
            { date: '2025-09-06', amount: 1900 },
            { date: '2025-09-07', amount: 2100 }
          ]
        },
        orders: {
          total: 1247,
          growth: 12.5,
          period: selectedPeriod === 'week' ? 'Esta semana' : selectedPeriod === 'month' ? 'Este mes' : 'Este año',
          byStatus: {
            pending: 23,
            preparing: 15,
            delivered: 1180,
            cancelled: 29
          }
        },
        products: {
          topSelling: [
            { name: 'Monstruo Clásico', sales: 245 },
            { name: 'Zona BBQ', sales: 189 },
            { name: 'Brutal Doble', sales: 156 },
            { name: 'Zona Picante', sales: 134 },
            { name: 'Refresco 500ml', sales: 298 }
          ]
        },
        customers: {
          total: 892,
          newCustomers: 45,
          returningCustomers: 847
        }
      };

      setReportData(mockData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  const exportReport = () => {
    // TODO: Implementar exportación real
    alert('Función de exportación próximamente disponible');
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

  if (!reportData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Error al cargar los reportes</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Reportes - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600 mt-2">Análisis detallado del rendimiento del negocio</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
            <button
              onClick={exportReport}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.sales.total)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{reportData.sales.growth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {reportData.orders.total}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{reportData.orders.growth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {reportData.customers.total}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    +{reportData.customers.newCustomers} nuevos
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Pedido</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.sales.total / reportData.orders.total)}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-600">Valor promedio</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ventas Diarias</h2>
              <span className="text-sm text-gray-500">{reportData.sales.period}</span>
            </div>
            <div className="space-y-4">
              {reportData.sales.daily.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(day.amount / Math.max(...reportData.sales.daily.map(d => d.amount))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                      {formatCurrency(day.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Estado de Pedidos</h2>
              <span className="text-sm text-gray-500">{reportData.orders.period}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pendientes</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {reportData.orders.byStatus.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Preparando</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {reportData.orders.byStatus.preparing}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Entregados</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {reportData.orders.byStatus.delivered}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Cancelados</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {reportData.orders.byStatus.cancelled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Productos Más Vendidos</h2>
            <span className="text-sm text-gray-500">{reportData.sales.period}</span>
          </div>
          <div className="space-y-4">
            {reportData.products.topSelling.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">#{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(product.sales / Math.max(...reportData.products.topSelling.map(p => p.sales))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {product.sales} ventas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Análisis de Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {reportData.customers.total}
              </div>
              <div className="text-sm text-gray-600">Clientes Totales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData.customers.newCustomers}
              </div>
              <div className="text-sm text-gray-600">Nuevos Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {reportData.customers.returningCustomers}
              </div>
              <div className="text-sm text-gray-600">Clientes Recurrentes</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
