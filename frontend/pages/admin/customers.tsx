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
  Calendar
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, statusFilter, sortBy]);

  const loadCustomers = async () => {
    try {
      // TODO: Reemplazar con llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'María González',
          email: 'maria@email.com',
          phone: '+52 555-0123',
          totalOrders: 15,
          totalSpent: 2450,
          lastOrder: '2025-09-16T19:30:00Z',
          createdAt: '2025-08-01T00:00:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Carlos Ruiz',
          email: 'carlos@email.com',
          phone: '+52 555-0456',
          totalOrders: 8,
          totalSpent: 1680,
          lastOrder: '2025-09-16T19:15:00Z',
          createdAt: '2025-08-15T00:00:00Z',
          status: 'active'
        },
        {
          id: '3',
          name: 'Ana Martínez',
          email: 'ana@email.com',
          phone: '+52 555-0789',
          totalOrders: 23,
          totalSpent: 3890,
          lastOrder: '2025-09-15T14:20:00Z',
          createdAt: '2025-07-20T00:00:00Z',
          status: 'active'
        },
        {
          id: '4',
          name: 'Pedro López',
          email: 'pedro@email.com',
          phone: '+52 555-0321',
          totalOrders: 3,
          totalSpent: 450,
          lastOrder: '2025-09-10T12:00:00Z',
          createdAt: '2025-09-01T00:00:00Z',
          status: 'inactive'
        },
        {
          id: '5',
          name: 'Laura Sánchez',
          email: 'laura@email.com',
          phone: '+52 555-0654',
          totalOrders: 12,
          totalSpent: 2100,
          lastOrder: '2025-09-14T18:45:00Z',
          createdAt: '2025-08-05T00:00:00Z',
          status: 'active'
        }
      ];

      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
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
          <div className="text-sm text-gray-500">
            Total: {filteredCustomers.length} clientes
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
                  <span>Último pedido: {formatDate(customer.lastOrder)}</span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Cliente desde: {formatDate(customer.createdAt)}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex-1 btn-outline text-sm py-2">
                  Ver Historial
                </button>
                <button className="flex-1 btn-primary text-sm py-2">
                  Contactar
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
    </AdminLayout>
  );
};

export default AdminCustomers;
