/**
 * Sesión del cliente del sitio público (cuenta de cliente).
 * Independiente por completo de la sesión del admin (utils/session.js).
 */

export interface ClienteSesion {
  token: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    loyalty_points: number;
    total_orders: number;
  };
}

const KEY = 'hamburguezona-cliente';

export const getClienteSesion = (): ClienteSesion | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClienteSesion) : null;
  } catch {
    return null;
  }
};

export const setClienteSesion = (sesion: ClienteSesion) => {
  localStorage.setItem(KEY, JSON.stringify(sesion));
};

export const clearClienteSesion = () => {
  localStorage.removeItem(KEY);
};
