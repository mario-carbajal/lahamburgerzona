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
  Image
} from 'lucide-react';
import { useAuth } from '../../middleware/auth';
import { getCurrentUser, hasValidSession } from '../../utils/globalSessionManager';
import GlobalLogout from '../GlobalLogout';
import SessionDebug from '../SessionDebug';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  // Obtener usuario desde el sistema global de sesión
  useEffect(() => {
    const checkUser = () => {
      console.log('AdminLayout: Verificando sesión...');
      console.log('AdminLayout: hasValidSession():', hasValidSession());
      
      if (hasValidSession()) {
        const currentUser = getCurrentUser();
        console.log('AdminLayout: Usuario desde globalSession:', currentUser ? 'exists' : 'null');
        if (currentUser) {
          setUser(currentUser);
          setIsLoading(false);
          return;
        }
      }
      
      // Si no hay sesión válida, verificar si el hook de auth tiene usuario
      console.log('AdminLayout: Usuario desde useAuth:', auth.user ? 'exists' : 'null');
      if (auth.user) {
        setUser(auth.user);
      }
      setIsLoading(false);
    };

    checkUser();
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
          { name: 'Hero', href: '/admin/hero', icon: Image },
          { name: 'Reseñas', href: '/admin/reviews', icon: Star },
          { name: 'Clientes', href: '/admin/customers', icon: Users },
          { name: 'Usuarios', href: '/admin/users', icon: Users },
          { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
          { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare },
          { name: 'Configuración', href: '/admin/settings', icon: Settings },
        ];
      case 'COCINA':
        return [
          ...baseNavigation,
          { name: 'Cocina', href: '/admin/cocina', icon: ShoppingCart },
          { name: 'Menú', href: '/admin/menu', icon: Package },
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
      <SessionDebug />
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-warm rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍔</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Toggle button - visible when sidebar is open */}
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Ocultar menú"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <nav className="mt-8 px-4">
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
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <GlobalLogout className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </GlobalLogout>
        </div>
      </div>

      {/* Main content */}
      <div className="transition-all duration-300 ease-in-out">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
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
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;

