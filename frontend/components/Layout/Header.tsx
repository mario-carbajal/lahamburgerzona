import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Phone, MapPin, Settings } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useCart();
  const cartItems = state.itemCount;

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
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-warm rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">🍔</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">La Hamburguezona</h1>
              <p className="text-sm text-gray-600">¡Sabor que conquista!</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-500 font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Cart and Contact Info */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>+52 555-0123</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Ciudad de México</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/admin/login" className="p-2 text-gray-600 hover:text-primary-500 transition-colors" title="Panel Administrativo">
                <Settings className="w-5 h-5" />
              </Link>
              
              <Link href="/pedidos" className="relative">
                <button className="btn-primary flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Carrito</span>
                  {cartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Cart and Menu */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Mobile Cart Button */}
            <Link href="/pedidos" className="relative">
              <button className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-all duration-200">
                <ShoppingCart className="w-5 h-5" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItems}
                  </span>
                )}
              </button>
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-500"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-500 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between px-4">
                  <div className="text-sm text-gray-600">
                    <p>📞 +52 555-0123</p>
                    <p>📍 Ciudad de México</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href="/admin/login" className="p-2 text-gray-600 hover:text-primary-500 transition-colors" title="Panel Administrativo">
                      <Settings className="w-5 h-5" />
                    </Link>
                    
                    {/* Mobile Cart Button - Same style as header */}
                    <Link href="/pedidos" className="relative">
                      <button className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-all duration-200">
                        <ShoppingCart className="w-5 h-5" />
                        {cartItems > 0 && (
                          <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {cartItems}
                          </span>
                        )}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
