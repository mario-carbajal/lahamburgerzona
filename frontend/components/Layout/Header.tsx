import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Phone, MapPin, Settings, Clock, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useBusinessInfo, phoneLink } from '../../contexts/BusinessInfoContext';
import { hasValidSession } from '../../utils/session';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useCart();
  const cartItems = state.itemCount;
  const business = useBusinessInfo();

  // El acceso al panel solo se muestra si este navegador ya tiene sesión de
  // admin (el personal entra directo por /admin/login); los clientes no lo ven
  const [esAdmin, setEsAdmin] = useState(false);
  useEffect(() => {
    setEsAdmin(hasValidSession());
  }, []);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Menú', href: '/menu' },
    { name: 'Pedidos', href: '/pedidos' },
    { name: 'Galería', href: '/galeria' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Opiniones', href: '/opiniones' },
    { name: 'Nosotros', href: '/nosotros' },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      {/* Top utility bar: contacto rápido, separado de la navegación principal */}
      <div className="hidden lg:block bg-dark-900 text-gray-300 text-xs">
        <div className="container-custom flex items-center justify-end gap-6 py-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-secondary-400" />
            <span>{business.openingHours}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-secondary-400" />
            <span>{business.city}</span>
          </div>
          <a href={phoneLink(business)} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3.5 h-3.5 text-secondary-400" />
            <span>{business.phone}</span>
          </a>
        </div>
      </div>

      {/* Barra principal */}
      <div className="bg-white">
        <div className="container-custom">
          <div className="flex justify-between items-center h-20 gap-4">
            {/* Logo (editable desde /admin/settings; sin logo cargado se usa el 🍔) */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-warm rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">🍔</span>
                </div>
              )}
              <div className="leading-tight">
                <h1 className="text-xl font-bold text-gradient whitespace-nowrap">{business.name}</h1>
                <p className="text-xs text-gray-500">{business.slogan}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-7">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-500 font-medium text-sm transition-colors duration-200 whitespace-nowrap"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Acciones a la derecha */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <Link
                href="/mi-cuenta"
                className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-gray-50 rounded-full transition-colors"
                title="Mi Cuenta: pedidos y puntos"
              >
                <User className="w-5 h-5" />
              </Link>
              {esAdmin && (
                <Link
                  href="/admin"
                  className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-gray-50 rounded-full transition-colors"
                  title="Panel Administrativo"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}

              <Link href="/pedidos">
                <button className="btn-primary flex items-center gap-2 relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Carrito</span>
                  {cartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                      {cartItems}
                    </span>
                  )}
                </button>
              </Link>
            </div>

            {/* Nav intermedia (lg pero no xl): solo carrito + menú hamburguesa, sin links completos */}
            <div className="hidden lg:flex xl:hidden items-center gap-2 shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-50 transition-colors"
                aria-label="Abrir menú de navegación"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile: carrito + botón de menú */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <Link href="/pedidos" className="relative">
                <button className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full shadow-md transition-all duration-200">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                      {cartItems}
                    </span>
                  )}
                </button>
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-50 transition-colors"
                aria-label="Abrir menú de navegación"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Navegación colapsable (mobile y tablet mediano) */}
          {isMenuOpen && (
            <div className="lg:hidden xl:hidden border-t border-gray-100 py-4 animate-fadeIn">
              <nav className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-primary-500 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-gray-100 px-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {business.phone}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {business.city}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href="/mi-cuenta"
                    className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-gray-50 rounded-full transition-colors"
                    title="Mi Cuenta"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  {esAdmin && (
                    <Link
                      href="/admin"
                      className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-gray-50 rounded-full transition-colors"
                      title="Panel Administrativo"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
