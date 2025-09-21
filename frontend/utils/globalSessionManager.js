// Sistema global de gestión de sesión que funciona en TODAS las páginas
const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';
const LAST_ACTIVITY_KEY = 'lastActivity';
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 días

// Verificar si hay una sesión válida (sin importar la página)
export const hasValidSession = (verbose = false) => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const userData = localStorage.getItem(ADMIN_USER_KEY);
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

  // Solo mostrar logs si se solicita explícitamente (sin datos sensibles)
  if (verbose) {
    console.log('hasValidSession check:');
    console.log('- Token:', token ? 'exists' : 'null');
    console.log('- UserData:', userData ? 'exists' : 'null');
    console.log('- LastActivity:', lastActivity ? 'exists' : 'null');
  }

  // Si no hay token, usuario o actividad, no hay sesión
  if (!token || !userData || !lastActivity) {
    if (verbose) console.log('hasValidSession: Missing required data');
    return false;
  }

  // Verificar que el token JWT sea válido
  if (!isTokenValid(token)) {
    if (verbose) console.log('Token JWT no válido o expirado localmente.');
    clearSession();
    return false;
  }

  const activityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();

  // Si ha pasado más tiempo del permitido, la sesión expira
  if (currentTime - activityTime > SESSION_TIMEOUT) {
    if (verbose) console.log('Session expired due to inactivity');
    clearSession();
    return false;
  }
  
  if (verbose) console.log('hasValidSession: Valid session');
  return true;
};

// Crear sesión (login)
export const createSession = (token, user) => {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    
    console.log('Sesión creada exitosamente');
    return true;
  } catch (error) {
    console.error('Error creating session:', error);
    return false;
  }
};

// Actualizar actividad del usuario (en cualquier página)
export const updateActivity = () => {
  if (typeof window === 'undefined') return;
  
  const currentTime = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, currentTime.toString());
};

// Limpiar sesión (logout)
export const clearSession = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  
  console.log('Sesión cerrada');
};

// Obtener usuario actual
export const getCurrentUser = (verbose = false) => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(ADMIN_USER_KEY);
  const user = userData ? JSON.parse(userData) : null;
  if (verbose) console.log('getCurrentUser():', user ? 'exists' : 'null');
  return user;
};

// Obtener token actual
export const getCurrentToken = (verbose = false) => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (verbose) console.log('getCurrentToken():', token ? 'exists' : 'null');
  return token;
};

// Verificar si el token JWT es válido
export const isTokenValid = (token) => {
  if (!token || typeof window === 'undefined') return false;
  
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp && payload.exp > currentTime;
  } catch (error) {
    console.warn('Error validating token:', error);
    return false;
  }
};

// Verificar si el usuario tiene un rol específico
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  return user && user.role === requiredRole;
};

// Verificar si el usuario tiene alguno de los roles especificados
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
};

// Inicializar el sistema global de sesión (optimizado para mejor rendimiento)
export const initializeGlobalSession = () => {
  if (typeof window === 'undefined') return;

  let lastActivityCheck = 0;
  const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // Solo verificar cada 5 minutos

  // Función optimizada para manejar actividad del usuario
  const handleActivity = () => {
    const now = Date.now();
    // Solo verificar sesión si ha pasado suficiente tiempo desde la última verificación
    if (now - lastActivityCheck > ACTIVITY_CHECK_INTERVAL) {
      if (hasValidSession()) {
        updateActivity();
        lastActivityCheck = now;
      }
    }
  };

  // Eventos reducidos para mejor rendimiento (solo los más importantes)
  const activityEvents = ['click', 'keydown'];
  
  // Agregar listeners de actividad
  activityEvents.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });

  // Verificar sesión solo cada 2 horas (mucho menos frecuente)
  const sessionCheckInterval = setInterval(() => {
    if (hasValidSession()) {
      updateActivity();
      lastActivityCheck = Date.now();
    }
  }, 2 * 60 * 60 * 1000);

  // Función de limpieza
  const cleanup = () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
    clearInterval(sessionCheckInterval);
  };

  // Limpiar al cerrar la ventana (opcional)
  window.addEventListener('beforeunload', cleanup);

  return cleanup;
};

// Refrescar token si es necesario
export const refreshTokenIfNeeded = async () => {
  const token = getCurrentToken();
  const user = getCurrentUser();
  
  if (!token || !user) return false;

  try {
    // Verificar si el token está cerca de expirar
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    
    // Si el token expira en menos de 1 día, refrescarlo
    if (timeUntilExpiry < 86400) {
      const response = await fetch('/api/admin-users/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.token) {
          // Actualizar el token
          localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token);
          updateActivity();
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Error refreshing token:', error);
    return false;
  }
};
