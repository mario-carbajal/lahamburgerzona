// Sistema simple de gestión de sesión
const SESSION_KEY = 'adminSession';
const USER_KEY = 'adminUser';
const TOKEN_KEY = 'adminToken';
const LAST_ACTIVITY_KEY = 'lastActivity';
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

// Verificar si hay una sesión válida
export const hasValidSession = () => {
  if (typeof window === 'undefined') return false;
  
  const session = getSession();
  if (!session) return false;
  
  // Verificar que el token sea válido
  if (!isTokenValid(session.token)) {
    clearSession();
    return false;
  }
  
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;
  
  const now = Date.now();
  const timeSinceActivity = now - parseInt(lastActivity);
  
  // Si ha pasado más de 1 hora sin actividad, la sesión expira
  if (timeSinceActivity > SESSION_TIMEOUT) {
    clearSession();
    return false;
  }
  
  return true;
};

// Obtener la sesión actual
export const getSession = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    const userData = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    // Si no hay session guardada pero sí hay token y usuario, reconstruirla
    if (!sessionData && token && userData) {
      const reconstructed = {
        created: Date.now(),
        lastActivity: lastActivity ? parseInt(lastActivity, 10) : Date.now(),
        token,
        user: JSON.parse(userData)
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(reconstructed));
      if (!lastActivity) {
        localStorage.setItem(LAST_ACTIVITY_KEY, reconstructed.lastActivity.toString());
      }
      return { session: reconstructed, user: reconstructed.user, token };
    }

    // Si faltan token o usuario, no hay sesión válida
    if (!token || !userData) {
      return null;
    }

    // Si falta solo sessionData, devolver estructura mínima
    if (!sessionData) {
      const user = JSON.parse(userData);
      return {
        session: { created: Date.now(), lastActivity: Date.now(), token, user },
        user,
        token
      };
    }
    
    const session = JSON.parse(sessionData);
    const user = JSON.parse(userData);
    
    return {
      session,
      user,
      token
    };
  } catch (error) {
    console.warn('Error parsing session data:', error);
    return null;
  }
};

// Crear una nueva sesión
export const createSession = (token, user) => {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionData = {
      created: Date.now(),
      lastActivity: Date.now(),
      token,
      user
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Error creating session:', error);
    return false;
  }
};

// Actualizar la actividad del usuario
export const updateActivity = () => {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  
  // Actualizar la sesión
  const session = getSession();
  if (session) {
    const updatedSession = {
      ...session.session,
      lastActivity: now
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
  }
};

// Limpiar la sesión
export const clearSession = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

// Verificar si el token es válido
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp && payload.exp > now;
  } catch (error) {
    console.warn('Error validating token:', error);
    return false;
  }
};

// Obtener el usuario actual
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const session = getSession();
  if (session && session.user) return session.user;
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Obtener el token actual
export const getCurrentToken = () => {
  if (typeof window === 'undefined') return null;
  const session = getSession();
  if (session && session.token) return session.token;
  return localStorage.getItem(TOKEN_KEY);
};

// Verificar si el usuario tiene un rol específico
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

// Verificar si el usuario tiene alguno de los roles especificados
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
};

// Refrescar token si es necesario
export const refreshTokenIfNeeded = async () => {
  const session = getSession();
  if (!session) return false;
  
  try {
    // Verificar si el token está cerca de expirar
    const tokenParts = session.token.split('.');
    if (tokenParts.length !== 3) return false;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    
    // Si el token expira en menos de 10 minutos, refrescarlo
    if (timeUntilExpiry < 600) {
      const response = await fetch('/api/admin-users/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.token) {
          // Actualizar el token en la sesión
          localStorage.setItem(TOKEN_KEY, data.data.token);
          
          const updatedSession = {
            ...session.session,
            token: data.data.token,
            lastRefresh: Date.now()
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
          
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
