import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, User, Lock, ChefHat, Truck, CreditCard, Shield } from 'lucide-react';
import { createSession } from '../../utils/session';
import apiService from '../../services/api';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Roles disponibles con sus descripciones
  const roles = [
    {
      value: 'ADMIN',
      label: 'Administrador',
      icon: Shield,
      description: 'Acceso completo al sistema',
      color: 'bg-red-500'
    },
    {
      value: 'COCINA',
      label: 'Cocina',
      icon: ChefHat,
      description: 'Gestionar pedidos y menú',
      color: 'bg-orange-500'
    },
    {
      value: 'REPARTIDOR',
      label: 'Repartidor',
      icon: Truck,
      description: 'Gestionar entregas',
      color: 'bg-blue-500'
    },
    {
      value: 'CAJA',
      label: 'Caja',
      icon: CreditCard,
      description: 'Gestionar pagos y facturación',
      color: 'bg-green-500'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.login(formData.username, formData.password);

      setSuccess('Inicio de sesión exitoso');
      createSession(response.data.token, response.data.usuario);

      const userRole = response.data.usuario.role;
      setTimeout(() => {
        switch (userRole) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'COCINA':
            router.push('/admin/cocina');
            break;
          case 'REPARTIDOR':
            router.push('/admin/repartidor');
            break;
          case 'CAJA':
            router.push('/admin/caja');
            break;
          default:
            router.push('/admin');
        }
      }, 1000);
    } catch (error) {
      console.error('Error en login:', error);
      setError(error instanceof Error ? error.message : 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si ya está logueado
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (token && user) {
      const userData = JSON.parse(user);
      router.push(`/admin${userData.role !== 'ADMIN' ? `/${userData.role.toLowerCase()}` : ''}`);
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Iniciar Sesión - La Hamburguezona Admin</title>
        <meta name="description" content="Panel de administración de La Hamburguezona" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">🍔</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  La Hamburguezona
                </h1>
                <p className="text-gray-600">Panel de Administración</p>
              </div>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              Accede al panel de administración con tu usuario y contraseña
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulario de Login */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Usuario */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ingresa tu usuario"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ingresa tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Mensajes */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{success}</p>
                  </div>
                )}

                {/* Botón de Login */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </form>

              {/* Link de regreso */}
              <div className="mt-6 text-center">
                <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  ← Volver al sitio principal
                </Link>
              </div>
            </div>

            {/* Información de Roles */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tipos de Usuario
                </h3>
                <div className="space-y-4">
                  {roles.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <div key={role.value} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`${role.color} p-2 rounded-lg`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{role.label}</h4>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">
                  ¿Necesitas acceso?
                </h4>
                <p className="text-blue-800 text-sm mb-4">
                  Contacta al administrador principal para obtener credenciales de acceso al sistema.
                </p>
                <div className="text-sm text-blue-700">
                  <p><strong>Email:</strong> contacto@hamburguezona.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;