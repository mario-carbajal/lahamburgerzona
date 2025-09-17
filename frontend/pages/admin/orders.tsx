import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'whatsapp';
  notes?: string;
  createdAt: string;
  estimatedDelivery: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      // TODO: Reemplazar con llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          customer: {
            name: 'María González',
            phone: '+52 555-0123',
            address: 'Calle Principal 123, Colonia Centro'
          },
          items: [
            { name: 'Monstruo Clásico', quantity: 2, price: 180 },
            { name: 'Papas Fritas', quantity: 1, price: 45 }
          ],
          total: 405,
          status: 'pending',
          paymentMethod: 'whatsapp',
          notes: 'Sin cebolla en una hamburguesa',
          createdAt: '2025-09-16T19:30:00Z',
          estimatedDelivery: '2025-09-16T20:00:00Z'
        },
        {
          id: 'ORD-002',
          customer: {
            name: 'Carlos Ruiz',
            phone: '+52 555-0456',
            address: 'Avenida Juárez 456, Colonia Norte'
          },
          items: [
            { name: 'Zona BBQ', quantity: 1, price: 220 },
            { name: 'Refresco 500ml', quantity: 2, price: 35 }
          ],
          total: 290,
          status: 'preparing',
          paymentMethod: 'cash',
          createdAt: '2025-09-16T19:15:00Z',
          estimatedDelivery: '2025-09-16T19:45:00Z'
        },
        {
          id: 'ORD-003',
          customer: {
            name: 'Ana Martínez',
            phone: '+52 555-0789',
            address: 'Calle Morelos 789, Colonia Sur'
          },
          items: [
            { name: 'Brutal Doble', quantity: 1, price: 280 },
            { name: 'Malteada de Vainilla', quantity: 1, price: 65 }
          ],
          total: 345,
          status: 'delivered',
          paymentMethod: 'card',
          createdAt: '2025-09-16T18:45:00Z',
          estimatedDelivery: '2025-09-16T19:15:00Z'
        }
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // TODO: Implementar actualización real
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
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

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'confirmed': return <Check className="w-4 h-4" />;
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
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
        <title>Gestión de Pedidos - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
            <p className="text-gray-600 mt-2">Administra todos los pedidos del restaurante</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredOrders.length} pedidos
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Listo</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pedido</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">#{order.id}</div>
                      <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.items.length} items</div>
                      <div className="text-sm text-gray-500">
                        {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">${order.total}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="p-2 text-purple-400 hover:text-purple-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Detalle del Pedido #{selectedOrder.id}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.customer.name}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedOrder.customer.phone}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedOrder.customer.address}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Items del Pedido</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">${item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${selectedOrder.total}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Método de pago:</span> {selectedOrder.paymentMethod}</p>
                    <p><span className="font-medium">Fecha de pedido:</span> {formatDate(selectedOrder.createdAt)}</p>
                    <p><span className="font-medium">Entrega estimada:</span> {formatDate(selectedOrder.estimatedDelivery)}</p>
                    {selectedOrder.notes && (
                      <p><span className="font-medium">Notas:</span> {selectedOrder.notes}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-gray-200">
                  <button className="flex-1 btn-primary">
                    Actualizar Estado
                  </button>
                  <button className="flex-1 btn-outline">
                    Contactar Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

