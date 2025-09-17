import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.username, formData.password);
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <>
      <Head>
        <title>Login Admin - La Hamburguezona</title>
      </Head>

      <div className="min-h-screen bg-gradient-warm flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🍔</span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Panel Administrativo
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Inicia sesión para acceder al panel de administración
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ingresa tu usuario"
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-500 hover:text-primary-400">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Credenciales de demostración:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Usuario:</strong> admin</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>
          </div>

          {/* Back to main site */}
          <div className="text-center">
            <a
              href="/"
              className="text-white hover:text-white/80 text-sm font-medium"
            >
              ← Volver al sitio principal
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;

