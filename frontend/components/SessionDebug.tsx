import { useEffect, useState } from 'react';
import { hasValidSession, getCurrentUser, getCurrentToken } from '../utils/globalSessionManager';
import { debugSession, resetSession } from '../utils/debugSession';

// Componente de debug para verificar el estado de la sesión
const SessionDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    hasValidSession: false,
    currentUser: null,
    currentToken: null,
    localStorage: {}
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      console.log('=== SessionDebug: Actualizando información ===');
      
      const validSession = hasValidSession();
      const user = getCurrentUser();
      const token = getCurrentToken();
      
      // Obtener datos del localStorage directamente
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const adminUser = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;
      const lastActivity = typeof window !== 'undefined' ? localStorage.getItem('lastActivity') : null;
      
      console.log('SessionDebug - Token directo del localStorage:', adminToken ? 'exists' : 'null');
      console.log('SessionDebug - getCurrentToken():', token ? 'exists' : 'null');
      
      const localStorageData = {
        adminToken,
        adminUser,
        lastActivity,
      };

      setDebugInfo({
        hasValidSession: validSession,
        currentUser: user,
        currentToken: token ? 'exists' : null,
        localStorage: localStorageData
      });
    };

    updateDebugInfo();
    
    // Solo actualizar cuando sea necesario, no constantemente
    // const interval = setInterval(updateDebugInfo, 1000);
    // return () => clearInterval(interval);
  }, []);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const checkLocalStorage = () => {
    console.log('=== Verificación manual del localStorage ===');
    console.log('localStorage.getItem("adminToken"):', localStorage.getItem('adminToken') ? 'exists' : 'null');
    console.log('localStorage.getItem("adminUser"):', localStorage.getItem('adminUser') ? 'exists' : 'null');
    console.log('localStorage.getItem("lastActivity"):', localStorage.getItem('lastActivity') ? 'exists' : 'null');
    console.log('Todas las claves del localStorage:', Object.keys(localStorage));
  };

  const refreshDebugInfo = () => {
    const updateDebugInfo = () => {
      console.log('=== SessionDebug: Actualizando información ===');
      
      const validSession = hasValidSession(true); // Modo verbose para debug
      const user = getCurrentUser(true); // Modo verbose para debug
      const token = getCurrentToken(true); // Modo verbose para debug
      
      // Obtener datos del localStorage directamente
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const adminUser = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;
      const lastActivity = typeof window !== 'undefined' ? localStorage.getItem('lastActivity') : null;
      
      console.log('SessionDebug - Token directo del localStorage:', adminToken ? 'exists' : 'null');
      console.log('SessionDebug - getCurrentToken():', token ? 'exists' : 'null');
      
      const localStorageData = {
        adminToken,
        adminUser,
        lastActivity,
      };

      setDebugInfo({
        hasValidSession: validSession,
        currentUser: user,
        currentToken: token ? 'exists' : null,
        localStorage: localStorageData
      });
    };
    updateDebugInfo();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white rounded-lg text-xs max-w-sm z-50">
      {/* Header con botón de colapsar */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-90"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="font-bold flex items-center">
          🔍 Session Debug
          <span className="ml-2 text-xs opacity-70">
            {debugInfo.hasValidSession ? '✅' : '❌'}
          </span>
        </h3>
        <button className="text-white hover:text-gray-300 transition-colors">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {/* Contenido colapsable */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="space-y-1">
            <div><strong>Valid Session:</strong> {debugInfo.hasValidSession ? '✅' : '❌'}</div>
            <div><strong>User Role:</strong> {debugInfo.currentUser?.role || 'null'}</div>
            <div><strong>User ID:</strong> {debugInfo.currentUser?.id || 'null'}</div>
            <div><strong>Token:</strong> {debugInfo.currentToken || 'null'}</div>
            <div><strong>LocalStorage Token:</strong> {debugInfo.localStorage.adminToken ? '✅' : '❌'}</div>
            <div><strong>LocalStorage User:</strong> {debugInfo.localStorage.adminUser ? '✅' : '❌'}</div>
            <div><strong>Last Activity:</strong> {debugInfo.localStorage.lastActivity ? '✅' : '❌'}</div>
          </div>
          <div className="mt-2 space-y-1">
            <button 
              onClick={refreshDebugInfo}
              className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              🔄 Actualizar Info
            </button>
            <button 
              onClick={checkLocalStorage}
              className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              🔍 Verificar localStorage
            </button>
            <button 
              onClick={() => debugSession()}
              className="w-full px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
            >
              🔧 Diagnóstico Completo
            </button>
            <button 
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres limpiar la sesión y volver al login?')) {
                  resetSession();
                }
              }}
              className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
            >
              🗑️ Limpiar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDebug;
