import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { hasValidSession, getCurrentUser, clearSession, hasRole, hasAnyRole } from '../utils/session';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasValidSession()) {
      setUser(getCurrentUser());
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [router]);

  const logout = () => {
    clearSession();
    setUser(null);
    router.push('/admin/login');
  };

  return {
    user,
    loading,
    logout,
    hasRole: (role) => hasRole(role),
    hasAnyRole: (roles) => hasAnyRole(roles),
    isAuthenticated: !!user,
  };
};

// HOC para proteger páginas que requieren autenticación.
// requiredRole acepta un rol ('ADMIN') o una lista de roles (['ADMIN', 'COCINA']).
export const withAuth = (WrappedComponent, requiredRole = null) => {
  const tieneRolRequerido = (auth) => {
    if (!requiredRole) return true;
    if (Array.isArray(requiredRole)) return auth.hasAnyRole(requiredRole);
    return auth.hasRole(requiredRole);
  };

  return function AuthenticatedComponent(props) {
    const auth = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient || auth.loading) return;

      if (!auth.isAuthenticated) {
        if (router.pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
        return;
      }

      if (!tieneRolRequerido(auth)) {
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
      }
    }, [isClient, auth.loading, auth.isAuthenticated, auth.user, router]);

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

    if (!auth.isAuthenticated) return null;
    if (!tieneRolRequerido(auth)) return null;

    return <WrappedComponent {...props} auth={auth} />;
  };
};
