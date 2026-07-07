import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import apiService from '../../services/api';
import type { Customer, Order } from '../../services/api';
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  Calendar,
  Edit,
  Eye,
  MessageCircle
} from 'lucide-react';

const PAGE_SIZE = 20;

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Estados para historial de pedidos
  const [customerOrders, setCustomerOrders] = useState<Order[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  // Debounce de la búsqueda (400ms); la búsqueda se hace en el servidor
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCustomers({
        q: debouncedSearch || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setCustomers(response.data);
      setTotal(response.total ?? response.data.length);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Ordenamiento sobre la página actual (la búsqueda/paginación son del servidor)
  const sortedCustomers = [...customers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'total_orders':
        return b.total_orders - a.total_orders;
      case 'total_spent':
        return b.total_spent - a.total_spent;
      case 'last_order_date':
        return new Date(b.last_order_date || 0).getTime() - new Date(a.last_order_date || 0).getTime();
      default:
        return 0;
    }
  });

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await apiService.updateCustomer(selectedCustomer.id, formData);
      setShowEditModal(false);
      setSelectedCustomer(null);
      loadCustomers();
      alert('Cliente actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating customer:', error);
      alert(error.message || 'Error al actualizar cliente');
    }
  };

  const loadCustomerHistory = async (customerId: Customer['id']) => {
    try {
      setHistoryLoading(true);
      const response = await apiService.getCustomer(customerId);
      setCustomerOrders(response.data.pedidos);
    } catch (error) {
      console.error('Error loading customer history:', error);
      setCustomerOrders(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryFilter('all');
    setShowHistoryModal(true);
    loadCustomerHistory(customer.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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
        <title>Gestión de Clientes - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600 mt-2">Administra la información de los clientes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Total: {total} clientes
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
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="total_orders">Ordenar por pedidos</option>
                <option value="total_spent">Ordenar por gasto total</option>
                <option value="last_order_date">Ordenar por último pedido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-warm rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{customer.email}</span>
                </div>

                {customer.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-4 h-4">📍</span>
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Pedidos</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{customer.total_orders}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Total</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span className="text-sm text-gray-500">⭐ Puntos</span>
                    </div>
                    <div className="text-lg font-semibold text-secondary-600">
                      {customer.loyalty_points ?? 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <Calendar className="w-3 h-3" />
                  <span>Último pedido: {customer.last_order_date ? formatDate(customer.last_order_date) : 'Nunca'}</span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Cliente desde: {formatDate(customer.created_at)}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  className="flex-1 btn-outline text-sm py-2 flex items-center justify-center space-x-1"
                  onClick={() => handleShowHistory(customer)}
                >
                  <Eye className="w-3 h-3" />
                  <span>Historial</span>
                </button>
                <button
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setFormData({
                      name: customer.name,
                      phone: customer.phone,
                      address: customer.address || ''
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {sortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-gray-600">
              No hay clientes que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}

        {/* Paginación */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Editar Cliente */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Cliente</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                }}
                className="flex-1 btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditCustomer}
                className="flex-1 btn-primary"
                disabled={!formData.name || !formData.phone}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial Detallado */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Historial de Pedidos
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedCustomer.name} - {selectedCustomer.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedCustomer(null);
                  setCustomerOrders(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : customerOrders ? (
                <div className="space-y-6">
                  {(() => {
                    const validOrders = customerOrders.filter(o => o.status !== 'cancelled');
                    const totalSpent = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
                    const avgOrderValue = validOrders.length > 0 ? totalSpent / validOrders.length : 0;
                    const firstOrderDate = customerOrders.length > 0
                      ? customerOrders.reduce((min, o) => (o.created_at < min ? o.created_at : min), customerOrders[0].created_at)
                      : null;
                    const visibleOrders = historyFilter === 'all'
                      ? customerOrders
                      : customerOrders.filter(o => o.status === historyFilter);

                    return (
                      <>
                        {/* Estadísticas del Cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <ShoppingBag className="w-8 h-8 text-blue-600" />
                              <div>
                                <p className="text-sm text-blue-600 font-medium">Total Pedidos</p>
                                <p className="text-2xl font-bold text-blue-900">{customerOrders.length}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <DollarSign className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="text-sm text-green-600 font-medium">Total Gastado</p>
                                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSpent)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <DollarSign className="w-8 h-8 text-orange-600" />
                              <div>
                                <p className="text-sm text-orange-600 font-medium">Promedio por Pedido</p>
                                <p className="text-2xl font-bold text-orange-900">{formatCurrency(avgOrderValue)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <Calendar className="w-8 h-8 text-purple-600" />
                              <div>
                                <p className="text-sm text-purple-600 font-medium">Cliente desde</p>
                                <p className="text-sm font-bold text-purple-900">
                                  {firstOrderDate ? formatDate(firstOrderDate) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                              value={historyFilter}
                              onChange={(e) => setHistoryFilter(e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

                          <div className="text-sm text-gray-500">
                            Mostrando {visibleOrders.length} de {customerOrders.length} pedidos
                          </div>
                        </div>

                        {/* Lista de Pedidos */}
                        <div className="space-y-4">
                          {visibleOrders.length > 0 ? (
                            visibleOrders.map((order) => (
                              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        Pedido #{order.order_number}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {formatDate(order.created_at)} - {order.items.length} items
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-4">
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                      {order.status}
                                    </span>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(order.total_amount)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Items del Pedido */}
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.menu_item_name}</p>
                                        {item.special_instructions && (
                                          <p className="text-xs text-blue-600 italic">
                                            Nota: {item.special_instructions}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">
                                          x{item.quantity}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                          {formatCurrency(item.total_price)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Información Adicional */}
                                {order.notes && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Notas:</span> {order.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No hay pedidos
                              </h3>
                              <p className="text-gray-600">
                                {historyFilter === 'all'
                                  ? 'Este cliente aún no ha realizado pedidos.'
                                  : `No hay pedidos con estado "${historyFilter}".`
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error al cargar historial
                  </h3>
                  <p className="text-gray-600">
                    No se pudo cargar el historial de pedidos del cliente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;
