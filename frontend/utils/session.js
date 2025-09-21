// Utilidades para manejo de sesión
export const isTokenValid = (token) => {
  if (!token) return false;
  
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

export const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('adminToken');
  const userData = localStorage.getItem('adminUser');
  
  if (!token || !userData) return null;
  
  try {
    const user = JSON.parse(userData);
    return { token, user };
  } catch (error) {
    console.warn('Error parsing user data:', error);
    return null;
  }
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export const refreshToken = async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  try {
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
        localStorage.setItem('adminToken', data.data.token);
        return true;
      }
    }
  } catch (error) {
    console.warn('Error refreshing token:', error);
  }
  
  return false;
};

export const verifySession = async () => {
  const session = getStoredSession();
  if (!session) return false;
  
  const { token, user } = session;
  
  // Verificar si el token es válido localmente
  if (!isTokenValid(token)) {
    // Intentar refrescar el token
    const refreshed = await refreshToken();
    if (!refreshed) {
      clearSession();
      return false;
    }
  }
  
  return true;
};
