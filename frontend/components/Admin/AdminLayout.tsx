import React, { useState } from 'react';
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
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Menú', href: '/admin/menu', icon: Package },
    { name: 'Hero', href: '/admin/hero', icon: Image },
    { name: 'Reseñas', href: '/admin/reviews', icon: Star },
    { name: 'Clientes', href: '/admin/customers', icon: Users },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
    { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-warm rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍔</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
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
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Bienvenido, <span className="font-semibold text-gray-900">Administrador</span>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
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

