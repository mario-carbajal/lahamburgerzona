import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import apiService from '../../services/api';
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
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  statusNotes?: string;
  itemCount: number;
  itemsSummary: string;
  items: Array<{
    id: number;
    menu_item_id?: number;
    menu_item_name?: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
    price?: number;
    unitPrice?: number;
    totalPrice?: number;
    special_instructions?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders-simple');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setOrders(data.data);
      } else {
        console.error('Error en respuesta de API:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // En caso de error, mostrar mensaje pero no bloquear la UI
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Si es confirmar pedido, mostrar modal de WhatsApp
        if (newStatus === 'confirmed') {
          const orderToConfirm = orders.find(order => order.id === orderId);
          if (orderToConfirm) {
            setConfirmingOrder(orderToConfirm);
            setShowWhatsAppModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelOrder = (orderId: number) => {
    setCancellingOrder(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!cancellingOrder || !cancelReason.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/orders/${cancellingOrder}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar la lista de pedidos
        const updatedOrders = orders.map(order =>
          order.id === cancellingOrder 
            ? { ...order, status: 'cancelled' as Order['status'], notes: `Pedido cancelado. Motivo: ${cancelReason.trim()}` }
            : order
        );
        setOrders(updatedOrders);
        setFilteredOrders(updatedOrders);
        
        // Cerrar modal y limpiar estado
        setShowCancelModal(false);
        setCancelReason('');
        setCancellingOrder(null);
        
        alert('Pedido cancelado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error al cancelar el pedido: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error al cancelar el pedido');
    }
  };

  const handleWhatsAppConfirm = () => {
    if (!confirmingOrder) return;
    
    // Generar mensaje de WhatsApp
    const message = `¡Hola! Tu pedido ${confirmingOrder.orderNumber} ha sido confirmado y está siendo preparado. 🍔

Detalles del pedido:
${confirmingOrder.itemsSummary}

Total: $${parseFloat(String(confirmingOrder.totalAmount || 0)).toFixed(2)}
Dirección: ${confirmingOrder.deliveryAddress}

¡Gracias por elegir La Hamburguezona! 😊`;

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/52${confirmingOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Cerrar modal
    setShowWhatsAppModal(false);
    setConfirmingOrder(null);
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

  const handleCreateCustomer = async () => {
    if (!selectedOrder) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/orders/${selectedOrder.id}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerForm),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Cliente creado/actualizado exitosamente');
        setShowCreateCustomerModal(false);
        setCustomerForm({ name: '', email: '', phone: '', address: '' });
        
        // Recargar el pedido para mostrar el email actualizado
        loadOrders();
        setSelectedOrder(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error al crear cliente');
    }
  };

  const openCreateCustomerModal = () => {
    if (selectedOrder) {
      setCustomerForm({
        name: selectedOrder.customerName,
        email: selectedOrder.customerEmail || '',
        phone: selectedOrder.customerPhone,
        address: selectedOrder.deliveryAddress
      });
      setShowCreateCustomerModal(true);
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
        <title>Gestión de Pedidos - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
            <p className="text-gray-600 mt-2">Administra todos los pedidos del restaurante</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Recargar
            </button>
            <div className="text-sm text-gray-500">
              Total: {filteredOrders.length} pedidos
            </div>
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
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
              <p className="text-gray-500 mb-4">No se encontraron pedidos que coincidan con los filtros actuales.</p>
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Recargar pedidos
              </button>
            </div>
          ) : (
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
                      <div className="font-semibold text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.itemCount} items</div>
                      <div className="text-sm text-gray-500">{order.itemsSummary}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</div>
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
                          <Eye className="w-10 h-10" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          >
                            <Check className="w-10 h-10" />
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Clock className="w-10 h-10" />
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="p-2 text-purple-400 hover:text-purple-600 transition-colors"
                          >
                            <CheckCircle className="w-10 h-10" />
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          >
                            <Truck className="w-10 h-10" />
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                            title="Cancelar pedido"
                          >
                            <X className="w-10 h-10" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Detalle del Pedido #{selectedOrder.orderNumber}</h2>
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
                    {selectedOrder.customerEmail && (
                      <button
                        onClick={openCreateCustomerModal}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Crear/Actualizar Cliente
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedOrder.customerPhone}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedOrder.deliveryAddress}</p>
                    {selectedOrder.customerEmail ? (
                      <div className="flex items-center justify-between">
                        <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                          Registrado
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-orange-600"><span className="font-medium">Email:</span> No registrado</p>
                        <button
                          onClick={openCreateCustomerModal}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Crear Cliente
                        </button>
                      </div>
                    )}
                    {selectedOrder.deliveryInstructions && (
                      <p><span className="font-medium">Instrucciones:</span> {selectedOrder.deliveryInstructions}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Items del Pedido</h3>
                  <div className="space-y-3">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.menu_item_name || `Item ${item.menu_item_id || item.id}`}</p>
                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                            <p className="text-sm text-gray-500">Precio unitario: ${parseFloat(String(item.unitPrice || 0)).toFixed(2)}</p>
                            {item.special_instructions && (
                              <p className="text-sm text-orange-600">Nota: {item.special_instructions}</p>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">${parseFloat(String(item.totalPrice || 0)).toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">No se encontraron items para este pedido</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="space-y-2">
                    {(() => {
                      // Calcular totales basados en los items
                      const itemsTotal = selectedOrder.items && selectedOrder.items.length > 0 
                        ? selectedOrder.items.reduce((sum, item) => sum + parseFloat(String(item.totalPrice || 0)), 0)
                        : 0;
                      const subtotalWithTax = itemsTotal;
                      const subtotalWithoutTax = subtotalWithTax / 1.16;
                      const tax = subtotalWithTax - subtotalWithoutTax;
                      const deliveryFee = subtotalWithTax >= 200 ? 0 : 30;
                      const total = subtotalWithTax + deliveryFee;
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Subtotal (sin IVA):</span>
                            <span>${subtotalWithoutTax.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>IVA (16%):</span>
                            <span>${tax.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Envío:</span>
                            <span>${deliveryFee.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-lg font-semibold text-gray-900 border-t pt-2">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Método de pago:</span> {selectedOrder.paymentMethod}</p>
                    <p><span className="font-medium">Estado de pago:</span> {selectedOrder.paymentStatus}</p>
                    <p><span className="font-medium">Fecha de pedido:</span> {formatDate(selectedOrder.createdAt)}</p>
                    {selectedOrder.notes && (
                      <p><span className="font-medium">Notas:</span> {selectedOrder.notes}</p>
                    )}
                    {selectedOrder.statusNotes && (
                      <p><span className="font-medium">Notas de estado:</span> {selectedOrder.statusNotes}</p>
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

        {/* Modal de Cancelación */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 transform animate-slideUp">
              <div className="text-center">
                {/* Icono de advertencia */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>

                {/* Título */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Cancelar Pedido
                </h2>

                {/* Mensaje */}
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.
                </p>

                {/* Campo de motivo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Motivo de cancelación *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Describe el motivo de la cancelación..."
                  />
                </div>

                {/* Botones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                      setCancellingOrder(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    disabled={!cancelReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Confirmar Cancelación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación WhatsApp */}
        {showWhatsAppModal && confirmingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 transform animate-slideUp">
              <div className="text-center">
                {/* Icono de WhatsApp */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>

                {/* Título */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Confirmar Pedido
                </h2>

                {/* Mensaje */}
                <p className="text-gray-600 mb-6">
                  El pedido <span className="font-semibold">{confirmingOrder.orderNumber}</span> ha sido confirmado. 
                  ¿Quieres enviar la confirmación por WhatsApp al cliente?
                </p>

                {/* Detalles del pedido */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{confirmingOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium">{confirmingOrder.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-green-600">${parseFloat(String(confirmingOrder.totalAmount || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowWhatsAppModal(false);
                      setConfirmingOrder(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleWhatsAppConfirm}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>Enviar WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Crear Cliente */}
        {showCreateCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Crear/Actualizar Cliente</h2>
                  <button
                    onClick={() => setShowCreateCustomerModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateCustomerModal(false)}
                  className="flex-1 btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCustomer}
                  className="flex-1 btn-primary"
                  disabled={!customerForm.name || !customerForm.email || !customerForm.phone}
                >
                  Crear Cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

