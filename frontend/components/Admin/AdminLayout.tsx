import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Menu, 
  X, 
  Home, 
  ShoppingCart, 
  Users, 
  Star, 
  Settings, 
  LogOut,
  BarChart3,
  Package,
  MessageSquare,
  Image,
  History,
  Boxes,
  Monitor,
  Ticket
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../middleware/auth';
import { getCurrentUser, hasValidSession } from '../../utils/session';
import apiService from '../../services/api';
import GlobalLogout from '../GlobalLogout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_PREF_KEY = 'adminSidebarOpen';

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Abierto por defecto (aprovecha el ancho en desktop); se recuerda la
  // preferencia del usuario si decide colapsarlo (por ejemplo, para ver
  // tablas anchas en Reportes o Pedidos).
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const router = useRouter();
  const auth = useAuth();

  // Badge de insumos bajo stock mínimo (solo roles con acceso al módulo);
  // se refresca al cambiar de página y cada 60s
  useEffect(() => {
    const role = user?.role;
    if (role !== 'ADMIN' && role !== 'COCINA') return;
    let activo = true;
    const cargar = () =>
      apiService
        .getSupplies({ activo: true, bajo_stock: true })
        .then((res) => { if (activo && res.ok) setLowStockCount(res.data.length); })
        .catch(() => {});
    cargar();
    const timer = setInterval(cargar, 60000);
    return () => { activo = false; clearInterval(timer); };
  }, [user, router.pathname]);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_PREF_KEY);
    if (stored !== null) setIsSidebarOpen(stored === 'true');
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PREF_KEY, String(next));
      return next;
    });
  };

  // Obtener usuario desde el sistema global de sesión
  useEffect(() => {
    if (hasValidSession()) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
        return;
      }
    }

    if (auth.user) {
      setUser(auth.user);
    }
    setIsLoading(false);
  }, [auth.user]);

  // Navegación según el rol del usuario
  const getNavigationByRole = (role) => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/admin', icon: Home },
    ];

    switch (role) {
      case 'ADMIN':
        return [
          ...baseNavigation,
          { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
          { name: 'Menú', href: '/admin/menu', icon: Package },
          { name: 'Insumos', href: '/admin/insumos', icon: Boxes },
          { name: 'Cupones', href: '/admin/cupones', icon: Ticket },
          { name: 'Hero', href: '/admin/hero', icon: Image },
          { name: 'Reseñas', href: '/admin/reviews', icon: Star },
          { name: 'Clientes', href: '/admin/customers', icon: Users },
          { name: 'Usuarios', href: '/admin/users', icon: Users },
          { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
          { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare },
          { name: 'Auditoría', href: '/admin/audit-log', icon: History },
          { name: 'Pantalla Cliente', href: '/admin/pantalla', icon: Monitor },
          { name: 'Configuración', href: '/admin/settings', icon: Settings },
        ];
      case 'COCINA':
        return [
          ...baseNavigation,
          { name: 'Cocina', href: '/admin/cocina', icon: ShoppingCart },
          { name: 'Menú', href: '/admin/menu', icon: Package },
          { name: 'Insumos', href: '/admin/insumos', icon: Boxes },
          { name: 'Pantalla Cliente', href: '/admin/pantalla', icon: Monitor },
        ];
      case 'REPARTIDOR':
        return [
          ...baseNavigation,
          { name: 'Entregas', href: '/admin/orders', icon: ShoppingCart },
        ];
      case 'CAJA':
        return [
          ...baseNavigation,
          { name: 'Transacciones', href: '/admin/orders', icon: ShoppingCart },
          { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
          { name: 'Pantalla Cliente', href: '/admin/pantalla', icon: Monitor },
        ];
      default:
        return baseNavigation;
    }
  };

  const navigation = getNavigationByRole(user?.role);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // El logout ahora se maneja por GlobalLogout

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden print:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay (solo móvil) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar: colapsable también en desktop (abierto por defecto).
          Columna flex: el nav scrollea si hay más opciones que altura de
          pantalla, y Cerrar Sesión queda fijo abajo sin tapar elementos. */}
      <div className={`print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-warm rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍔</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Ocultar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    // Solo cerrar automáticamente en móvil (overlay); en
                    // desktop el sidebar es parte del layout y debe quedarse
                    // como el usuario lo dejó.
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Insumos' && lowStockCount > 0 && (
                    <span
                      className="ml-2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                      title={`${lowStockCount} insumo(s) en o bajo stock mínimo`}
                    >
                      {lowStockCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 shrink-0">
          <GlobalLogout className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </GlobalLogout>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out print:ml-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top bar */}
        <header className="print:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 pl-16 pr-6 lg:pl-6 lg:pr-6">
            <div className="flex items-center space-x-4">
              {/* Toggle del sidebar en desktop, solo visible cuando está colapsado */}
              {!isSidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Mostrar menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="text-sm text-gray-600">
                Bienvenido, <span className="font-semibold text-gray-900">{user?.full_name || 'Usuario'}</span>
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {user?.role || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {user?.email}
              </div>
              <GlobalLogout className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </GlobalLogout>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 print:p-0">
          {children}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: '#10b981' } },
          error: { style: { background: '#ef4444' } },
        }}
      />
    </div>
  );
};

export default AdminLayout;

