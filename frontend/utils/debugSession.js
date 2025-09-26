// Script de diagnóstico para verificar el estado de la sesión
export const debugSession = () => {
  if (typeof window === 'undefined') {
    console.log('❌ No se puede ejecutar en el servidor');
    return;
  }

  console.log('🔍 DIAGNÓSTICO DE SESIÓN');
  console.log('========================');

  // Verificar localStorage
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');
  const lastActivity = localStorage.getItem('lastActivity');

  console.log('📦 LocalStorage:');
  console.log('- adminToken:', adminToken ? '✅ Existe' : '❌ No existe');
  console.log('- adminUser:', adminUser ? '✅ Existe' : '❌ No existe');
  console.log('- lastActivity:', lastActivity ? '✅ Existe' : '❌ No existe');

  if (adminToken) {
    try {
      const tokenParts = adminToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < currentTime;
        
        console.log('🔑 Token JWT:');
        console.log('- Estructura:', '✅ Válida');
        console.log('- Expira en:', new Date(payload.exp * 1000).toLocaleString());
        console.log('- Tiempo actual:', new Date(currentTime * 1000).toLocaleString());
        console.log('- Estado:', isExpired ? '❌ Expirado' : '✅ Válido');
        console.log('- Usuario ID:', payload.userId || 'N/A');
        console.log('- Rol:', payload.role || 'N/A');
      } else {
        console.log('🔑 Token JWT: ❌ Estructura inválida');
      }
    } catch (error) {
      console.log('🔑 Token JWT: ❌ Error al decodificar:', error.message);
    }
  }

  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      console.log('👤 Usuario:');
      console.log('- ID:', user.id || 'N/A');
      console.log('- Username:', user.username || 'N/A');
      console.log('- Role:', user.role || 'N/A');
      console.log('- Email:', user.email || 'N/A');
    } catch (error) {
      console.log('👤 Usuario: ❌ Error al parsear:', error.message);
    }
  }

  if (lastActivity) {
    const activityTime = parseInt(lastActivity, 10);
    const currentTime = Date.now();
    const timeDiff = currentTime - activityTime;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    
    console.log('⏰ Actividad:');
    console.log('- Última actividad:', new Date(activityTime).toLocaleString());
    console.log('- Tiempo transcurrido:', `${hoursDiff} horas`);
    console.log('- Estado:', timeDiff > (30 * 24 * 60 * 60 * 1000) ? '❌ Expirado' : '✅ Válido');
  }

  // Verificar si la sesión es válida según el globalSessionManager
  console.log('🎯 Resultado final:');
  console.log('- Sesión válida:', hasValidSession(true) ? '✅ Sí' : '❌ No');
};

// Función para limpiar la sesión y hacer login de nuevo
export const resetSession = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🔄 Limpiando sesión...');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('lastActivity');
  console.log('✅ Sesión limpiada. Redirigiendo al login...');
  
  // Redirigir al login
  window.location.href = '/admin/login';
};

// Importar hasValidSession del globalSessionManager
import { hasValidSession } from './globalSessionManager.js';
