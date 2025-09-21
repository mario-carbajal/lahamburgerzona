import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { hasValidSession, getCurrentUser, clearSession, hasRole, hasAnyRole } from '../utils/globalSessionManager';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar si hay una sesión válida usando el sistema global
        if (hasValidSession()) {
          const user = getCurrentUser();
          if (user) {
            setUser(user);
            setLoading(false);
            return;
          }
        }
        
        // Si no hay sesión válida, limpiar estado
        setUser(null);
        setLoading(false);
        
      } catch (error) {
        console.error('Error verifying auth:', error);
        clearSession();
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // El logout ahora se maneja por GlobalLogout
  const logout = () => {
    clearSession();
    setUser(null);
    router.push('/admin/login');
  };

  const checkRole = (requiredRole) => {
    return hasRole(requiredRole);
  };

  const checkAnyRole = (roles) => {
    return hasAnyRole(roles);
  };

  return {
    user,
    loading,
    logout,
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    isAuthenticated: !!user
  };
};

// HOC para proteger páginas que requieren autenticación
export const withAuth = (WrappedComponent, requiredRole = null) => {
  return function AuthenticatedComponent(props) {
    const auth = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // Evitar problemas de hidratación
    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      // Solo hacer redirecciones después de que el componente esté hidratado
      if (!isClient || auth.loading) return;

      if (!auth.isAuthenticated) {
        // Solo redirigir si no estamos ya en login y no hemos intentado redirigir antes
        if (router.pathname !== '/admin/login' && !shouldRedirect) {
          setShouldRedirect(true);
          // Usar setTimeout para evitar el error de abort durante hidratación
          setTimeout(() => {
            router.replace('/admin/login');
          }, 0);
        }
        return;
      }

      if (requiredRole && !auth.hasRole(requiredRole)) {
        // Redirigir según el rol del usuario solo si no hemos redirigido antes
        if (!shouldRedirect) {
          setShouldRedirect(true);
          setTimeout(() => {
            switch (auth.user?.role) {
              case 'ADMIN':
                router.replace('/admin');
                break;
              case 'COCINA':
                router.replace('/admin/cocina');
                break;
              case 'REPARTIDOR':
                router.replace('/admin/repartidor');
                break;
              case 'CAJA':
                router.replace('/admin/caja');
                break;
              default:
                router.replace('/admin/login');
            }
          }, 0);
        }
        return;
      }

      // Resetear flag de redirección si la autenticación es válida
      if (auth.isAuthenticated && (!requiredRole || auth.hasRole(requiredRole))) {
        setShouldRedirect(false);
      }
    }, [isClient, auth.loading, auth.isAuthenticated, auth.user, router, requiredRole, shouldRedirect]);

    // Mostrar loading durante hidratación o verificación
    if (!isClient || auth.loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      );
    }

    // Mostrar loading si estamos redirigiendo
    if (shouldRedirect) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Redirigiendo...</p>
          </div>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      return null; // Se está redirigiendo al login
    }

    if (requiredRole && !auth.hasRole(requiredRole)) {
      return null; // Se está redirigiendo según el rol
    }

    return <WrappedComponent {...props} auth={auth} />;
  };
};
