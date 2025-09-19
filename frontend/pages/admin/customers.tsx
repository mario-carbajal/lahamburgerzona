import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  Search, 
  Filter,
  User,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageCircle
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Estados para historial de pedidos
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLimit] = useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, statusFilter, sortBy]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token', // Token de autenticación para admin
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setCustomers(data.data);
      } else {
        console.error('Error loading customers:', data.error);
        // Fallback a datos mock en caso de error
        loadMockCustomers();
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      // En caso de error, usar datos mock como fallback
      loadMockCustomers();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockCustomers = () => {
    const mockCustomers: Customer[] = [
      {
        id: 1,
        name: 'María González',
        email: 'maria@email.com',
        phone: '+52 555-0123',
        address: 'Calle 123, Colonia Centro',
        totalOrders: 15,
        totalSpent: 2450,
        lastOrder: '2025-09-16T19:30:00Z',
        createdAt: '2025-08-01T00:00:00Z',
        updatedAt: '2025-08-01T00:00:00Z',
        status: 'active'
      },
      {
        id: 2,
        name: 'Carlos Ruiz',
        email: 'carlos@email.com',
        phone: '+52 555-0456',
        address: 'Av. Principal 456',
        totalOrders: 8,
        totalSpent: 1680,
        lastOrder: '2025-09-16T19:15:00Z',
        createdAt: '2025-08-15T00:00:00Z',
        updatedAt: '2025-08-15T00:00:00Z',
        status: 'active'
      },
      {
        id: 3,
        name: 'Ana Martínez',
        email: 'ana@email.com',
        phone: '+52 555-0789',
        address: 'Plaza Central 789',
        totalOrders: 23,
        totalSpent: 3890,
        lastOrder: '2025-09-15T14:20:00Z',
        createdAt: '2025-07-20T00:00:00Z',
        updatedAt: '2025-07-20T00:00:00Z',
        status: 'active'
      },
      {
        id: 4,
        name: 'Pedro López',
        email: 'pedro@email.com',
        phone: '+52 555-0321',
        address: 'Calle Secundaria 321',
        totalOrders: 3,
        totalSpent: 450,
        lastOrder: '2025-09-10T12:00:00Z',
        createdAt: '2025-09-01T00:00:00Z',
        updatedAt: '2025-09-01T00:00:00Z',
        status: 'inactive'
      },
      {
        id: 5,
        name: 'Laura Sánchez',
        email: 'laura@email.com',
        phone: '+52 555-0654',
        address: 'Av. Norte 654',
        totalOrders: 12,
        totalSpent: 2100,
        lastOrder: '2025-09-14T18:45:00Z',
        createdAt: '2025-08-05T00:00:00Z',
        updatedAt: '2025-08-05T00:00:00Z',
        status: 'active'
      }
    ];
    setCustomers(mockCustomers);
  };

  const filterAndSortCustomers = () => {
    let filtered = customers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'lastOrder':
          return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime();
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  // Funciones CRUD
  const handleCreateCustomer = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ name: '', email: '', phone: '', address: '' });
        loadCustomers(); // Recargar lista
        alert('Cliente creado exitosamente');
      } else {
        alert(data.message || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error al crear cliente');
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`http://localhost:5000/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedCustomer(null);
        setFormData({ name: '', email: '', phone: '', address: '' });
        loadCustomers(); // Recargar lista
        alert('Cliente actualizado exitosamente');
      } else {
        alert(data.message || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error al actualizar cliente');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`http://localhost:5000/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        setSelectedCustomer(null);
        loadCustomers(); // Recargar lista
        alert('Cliente eliminado exitosamente');
      } else {
        alert(data.message || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error al eliminar cliente');
    }
  };

  const loadCustomerHistory = async (customerId: number) => {
    try {
      setHistoryLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setCustomerHistory(data.data);
        console.log('Customer history loaded:', data.data);
      } else {
        console.error('Error loading customer history:', data.error);
        setCustomerHistory(null);
      }
    } catch (error) {
      console.error('Error loading customer history:', error);
      setCustomerHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryPage(0);
    setHistoryFilter('all');
    setShowHistoryModal(true);
    loadCustomerHistory(customer.id);
  };

  const handleHistoryFilterChange = (newFilter: string) => {
    setHistoryFilter(newFilter);
    // Por ahora no aplicamos filtros, solo actualizamos el estado
    console.log('Filter changed to:', newFilter);
  };

  const handleHistoryPageChange = (newPage: number) => {
    setHistoryPage(newPage);
    // Por ahora no aplicamos paginación, solo actualizamos el estado
    console.log('Page changed to:', newPage);
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
              Total: {filteredCustomers.length} clientes
            </div>
            <button 
              className="btn-primary flex items-center space-x-2"
              onClick={() => {
                setFormData({ name: '', email: '', phone: '', address: '' });
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
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
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="totalOrders">Ordenar por pedidos</option>
                <option value="totalSpent">Ordenar por gasto total</option>
                <option value="lastOrder">Ordenar por último pedido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-warm rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  customer.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
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

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Pedidos</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{customer.totalOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Total</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <Calendar className="w-3 h-3" />
                  <span>Último pedido: {customer.lastOrder ? formatDate(customer.lastOrder) : 'Nunca'}</span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Cliente desde: {formatDate(customer.createdAt)}</span>
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
                      email: customer.email,
                      phone: customer.phone,
                      address: customer.address || ''
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                  <span>Editar</span>
                </button>
                <button 
                  className="btn-danger text-sm py-2 px-3 flex items-center justify-center"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
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
      </div>

      {/* Modal Crear Cliente */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Cliente</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+52 555-0123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (opcional)</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Dirección completa"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCustomer}
                className="flex-1 btn-primary"
                disabled={!formData.name || !formData.email || !formData.phone}
              >
                Crear Cliente
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                disabled={!formData.name || !formData.email || !formData.phone}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cliente */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Eliminar Cliente</h2>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar al cliente <strong>{selectedCustomer.name}</strong>?
              {selectedCustomer.totalOrders > 0 && (
                <span className="block mt-2 text-red-600 text-sm">
                  ⚠️ Este cliente tiene {selectedCustomer.totalOrders} pedidos y no se puede eliminar.
                </span>
              )}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCustomer(null);
                }}
                className="flex-1 btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 btn-danger"
                disabled={selectedCustomer.totalOrders > 0}
              >
                Eliminar
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
                  setCustomerHistory(null);
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
              ) : customerHistory ? (
                <div className="space-y-6">
                  {/* Estadísticas del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <ShoppingBag className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Pedidos</p>
                          <p className="text-2xl font-bold text-blue-900">{customerHistory.stats.totalOrders}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Total Gastado</p>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(customerHistory.stats.totalSpent)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Promedio por Pedido</p>
                          <p className="text-2xl font-bold text-orange-900">{formatCurrency(customerHistory.stats.avgOrderValue)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Cliente desde</p>
                          <p className="text-sm font-bold text-purple-900">
                            {customerHistory.stats.firstOrderDate ? formatDate(customerHistory.stats.firstOrderDate) : 'N/A'}
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
                        onChange={(e) => handleHistoryFilterChange(e.target.value)}
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
                      Mostrando {customerHistory.orders.length} de {customerHistory.pagination.total} pedidos
                    </div>
                  </div>

                  {/* Lista de Pedidos */}
                  <div className="space-y-4">
                    {customerHistory.orders.length > 0 ? (
                      customerHistory.orders.map((order: any) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Pedido #{order.order_number}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(order.createdAt)} - {order.itemCount} items
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${order.statusColor}`}>
                                {order.statusLabel}
                              </span>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(order.totalAmount)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Items del Pedido */}
                          <div className="space-y-2">
                            {order.items.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500">{item.category}</p>
                                  {item.specialInstructions && (
                                    <p className="text-xs text-blue-600 italic">
                                      Nota: {item.specialInstructions}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">
                                    x{item.quantity}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.totalPrice)}
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

                  {/* Paginación */}
                  {customerHistory.pagination.total > historyLimit && (
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleHistoryPageChange(historyPage - 1)}
                        disabled={historyPage === 0}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      
                      <span className="px-3 py-2 text-sm text-gray-600">
                        Página {historyPage + 1} de {Math.ceil(customerHistory.pagination.total / historyLimit)}
                      </span>
                      
                      <button
                        onClick={() => handleHistoryPageChange(historyPage + 1)}
                        disabled={!customerHistory.pagination.hasMore}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
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
