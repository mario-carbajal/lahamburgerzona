import { useRouter } from 'next/router';
import { clearSession } from '../utils/globalSessionManager';

// Componente para cerrar sesión globalmente
const GlobalLogout = ({ children, className = '' }) => {
  const router = useRouter();

  const handleLogout = () => {
    // Limpiar sesión
    clearSession();
    
    // Redirigir al login
    router.push('/admin/login');
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children}
    </button>
  );
};

export default GlobalLogout;
