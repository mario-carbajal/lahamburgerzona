import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
// Removed apiGet, apiPut imports - using fetch directly like orders page
import { Clock, Users, ChefHat, CheckCircle, Eye, AlertCircle, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: number;
  quantity: number;
  price: string;
  product_name?: string;
  special_instructions?: string;
  created_at: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  total?: number;
  status: string;
  items: OrderItem[];
  deliveryInstructions?: string;
  deliveryAddress?: string;
  special_instructions?: string;
  createdAt: string;
  created_at?: string;
  estimated_delivery?: string;
}

interface KitchenStats {
  pending_orders: number;
  in_progress_orders: number;
  completed_today: number;
  avg_prep_time: number;
  confirmed_orders: number;
}

const CocinaDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<KitchenStats>({
    pending_orders: 0,
    in_progress_orders: 0,
    completed_today: 0,
    avg_prep_time: 0,
    confirmed_orders: 0
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

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

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=pending,confirmed,preparing&limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.message.includes('Token expirado')) {
        // El token expiró y no se pudo refrescar, redirigir al login
        window.location.href = '/admin/login';
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reports/kitchen-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.message.includes('Token expirado')) {
        // El token expiró y no se pudo refrescar, redirigir al login
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setMenuItems(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      if (error.message.includes('Token expirado')) {
        // El token expiró y no se pudo refrescar, redirigir al login
        window.location.href = '/admin/login';
      }
    }
  };

  const getMenuItemById = (menuItemId: number) => {
    return menuItems.find(item => item.id === menuItemId.toString());
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders();
        await fetchStats();
        
        // Cerrar modal si se completó la orden
        if (newStatus === 'ready') {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }
      } else {
        alert('Error al actualizar el estado del pedido');
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
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
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

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos activos</h3>
              <p className="text-gray-500">Los nuevos pedidos aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getPriorityColor(order)}`}
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-lg font-bold">
                        #{order.orderNumber}
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 font-medium">
                        {formatTime(order.createdAt || order.created_at)}
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
                      <span className="font-semibold text-gray-900">{order.customerName}</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      📞 {order.customerPhone}
                    </div>
                    {order.deliveryAddress && (
                      <div className="text-sm text-gray-600 ml-6 mt-1">
                        📍 {order.deliveryAddress}
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
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border">
                            <span className="text-sm font-medium text-gray-700">
                              {item.quantity}x {menuItem ? menuItem.name : `Producto ${item.menu_item_id}`}
                            </span>
                            <span className="text-sm font-semibold text-orange-600">
                              {formatCurrency(parseFloat(item.price) * item.quantity)}
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
                  {order.deliveryInstructions && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-xs font-medium text-yellow-800 mb-1">📝 Instrucciones especiales:</div>
                      <div className="text-sm text-yellow-700">{order.deliveryInstructions}</div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-xl text-orange-600">
                      {formatCurrency(order.totalAmount || order.total)}
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
        </div>

        {/* Order Detail Modal */}
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pedido #{selectedOrder.orderNumber}
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
                        <span>{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 text-gray-400">📞</span>
                        <span>{selectedOrder.customerPhone}</span>
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
                        Total: <span className="font-semibold">{formatCurrency(selectedOrder.total)}</span>
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
                                  Precio: {formatCurrency(parseFloat(item.price))}
                                </span>
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                                  Total: {formatCurrency(parseFloat(item.price) * item.quantity)}
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
                {selectedOrder.special_instructions && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Instrucciones Generales del Pedido</h4>
                    <p className="text-blue-800">{selectedOrder.special_instructions}</p>
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