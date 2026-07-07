import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

export interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  openingHours: string;
  whatsappNumber: string; // 10 dígitos, sin lada de país
  facebookUrl: string;
  logoUrl: string; // vacío = logo por defecto (🍔)
  slogan: string;
}

// Valores por defecto: los datos reales del negocio. Se muestran de inmediato
// y luego se sobreescriben con lo que haya en la tabla `settings` del backend
// (editable desde /admin/settings sin tocar código).
const DEFAULTS: BusinessInfo = {
  name: 'La Hamburguezona',
  phone: '228 144 0319',
  email: 'contacto@hamburguezona.com',
  address: 'Ave. Américas, Xalapa, Veracruz',
  city: 'Xalapa, Veracruz',
  openingHours: 'Mar - Sáb · 16:00 - 22:00',
  whatsappNumber: '2281440319',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61581846513047',
  logoUrl: '',
  slogan: '¡Sabor que conquista!',
};

const BusinessInfoContext = createContext<BusinessInfo>(DEFAULTS);

export const BusinessInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [info, setInfo] = useState<BusinessInfo>(DEFAULTS);

  useEffect(() => {
    apiService
      .getPublicSettings()
      .then((res) => {
        const s = res.data;
        setInfo((prev) => ({
          name: s.restaurant_name || prev.name,
          phone: s.restaurant_phone || prev.phone,
          email: s.restaurant_email || prev.email,
          address: s.restaurant_address || prev.address,
          city: s.restaurant_city || prev.city,
          openingHours: s.opening_hours || prev.openingHours,
          whatsappNumber: s.whatsapp_number || prev.whatsappNumber,
          facebookUrl: s.facebook_url || prev.facebookUrl,
          // logo_url vacío es un valor válido (= usar el logo por defecto)
          logoUrl: s.logo_url ?? prev.logoUrl,
          slogan: s.slogan || prev.slogan,
        }));
      })
      .catch(() => {
        // Sin conexión al backend se quedan los defaults; no es crítico.
      });
  }, []);

  return <BusinessInfoContext.Provider value={info}>{children}</BusinessInfoContext.Provider>;
};

export const useBusinessInfo = () => useContext(BusinessInfoContext);

/** Número en formato wa.me: lada de país 52 + 10 dígitos. */
export const whatsappLink = (info: BusinessInfo, text?: string) => {
  const digits = info.whatsappNumber.replace(/\D/g, '');
  const full = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

/** Número en formato tel: para enlaces de llamada. */
export const phoneLink = (info: BusinessInfo) => {
  const digits = info.phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `+52${digits}` : `+${digits}`;
  return `tel:${full}`;
};
