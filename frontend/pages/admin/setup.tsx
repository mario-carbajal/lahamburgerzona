import React, { useState } from 'react';
import Head from 'next/head';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const SetupPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const createAdminUser = async () => {
    setIsCreating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setError('Error de conexión. Verifica que el servidor esté corriendo.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Configuración Inicial - La Hamburguezona Admin</title>
        <meta name="description" content="Configuración inicial del sistema" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Configuración Inicial
            </h2>
            <p className="text-gray-600">
              Crea el usuario administrador para acceder al sistema
            </p>
          </div>

          {/* Setup Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!result ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Usuario Administrador
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Se creará un usuario administrador con los siguientes datos:
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Usuario:</span>
                    <span className="text-gray-900">admin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="text-gray-900">admin@lahamburguezona.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Contraseña:</span>
                    <span className="text-gray-900">admin123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Rol:</span>
                    <span className="text-gray-900">ADMIN</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={createAdminUser}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando usuario...</span>
                    </div>
                  ) : (
                    'Crear Usuario Administrador'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ¡Usuario Creado Exitosamente!
                  </h3>
                  <p className="text-sm text-gray-600">
                    El usuario administrador ha sido creado correctamente.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Credenciales de Acceso:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Usuario:</span>
                      <span className="font-mono text-green-900">{result.data.credentials.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Contraseña:</span>
                      <span className="font-mono text-green-900">{result.data.credentials.password}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Importante:</strong> Cambia la contraseña después del primer login por seguridad.
                  </p>
                </div>

                <a
                  href="/admin/login"
                  className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 text-center"
                >
                  Ir al Login
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              La Hamburguezona - Sistema de Administración
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupPage;
