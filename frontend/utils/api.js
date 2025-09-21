// Utilidad para hacer peticiones HTTP con manejo automático de autenticación
import { getCurrentToken, getCurrentUser, clearSession, createSession } from './sessionManagerSimple';

export const apiRequest = async (url, options = {}) => {
  const token = getCurrentToken() || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Cache buster para GETs y evitar 304/etags en dev
  const method = (config.method || 'GET').toUpperCase();
  const urlWithBuster = method === 'GET'
    ? (url.includes('?') ? `${url}&_=${Date.now()}` : `${url}?_=${Date.now()}`)
    : url;

  try {
    const response = await fetch(urlWithBuster, { ...config, cache: 'no-store' });
    
    // Si el token ha expirado (401 o 403), intentar refrescar
    if (((response.status === 401 || response.status === 403) || response.status === 304) && token) {
      try {
        const refreshResponse = await fetch('/api/admin-users/refresh-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.success && refreshData.data && refreshData.data.token) {
                // Actualizar el token en el SessionManager
                const currentUser = getCurrentUser();
                if (currentUser) {
                  createSession(refreshData.data.token, currentUser);
                }
                
                // Reintentar la petición original con el nuevo token
                config.headers['Authorization'] = `Bearer ${refreshData.data.token}`;
                return await fetch(urlWithBuster, { ...config, cache: 'no-store' });
              }
            }
            
            // No se pudo refrescar el token, limpiar sesión
            console.warn('Token expirado y no se pudo refrescar');
            clearSession();
            // Redirigir al login
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/login';
            }
            throw new Error('Token expirado y no se pudo refrescar');
      } catch (refreshError) {
        console.warn('Error refreshing token:', refreshError);
        clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw new Error('Error refreshing token');
      }
    }

    return response;
  } catch (error) {
    console.error('Error en petición API:', error);
    throw error;
  }
};

// Función helper para GET requests
export const apiGet = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'GET' });
};

// Función helper para POST requests
export const apiPost = (url, data, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Función helper para PUT requests
export const apiPut = (url, data, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Función helper para DELETE requests
export const apiDelete = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'DELETE' });
};
