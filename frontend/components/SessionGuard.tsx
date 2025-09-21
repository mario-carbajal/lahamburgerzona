import { useEffect } from 'react';
import { hasValidSession, updateActivity } from '../utils/globalSessionManager';

// Componente que mantiene la sesión activa en páginas públicas
const SessionGuard = ({ children }) => {
  useEffect(() => {
    // Verificar y mantener la sesión activa
    const checkAndMaintainSession = () => {
      if (hasValidSession()) {
        // Actualizar actividad
        updateActivity();
      }
    };

    // Verificar sesión al montar el componente
    checkAndMaintainSession();

    // Configurar intervalos para mantener la sesión activa
    const activityInterval = setInterval(() => {
      checkAndMaintainSession();
    }, 5 * 60 * 1000); // Cada 5 minutos

    // Limpiar intervalos al desmontar
    return () => {
      clearInterval(activityInterval);
    };
  }, []);

  return children;
};

export default SessionGuard;
