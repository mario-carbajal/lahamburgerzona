import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Mail, Clock, Facebook, MessageCircle } from 'lucide-react';
import { useBusinessInfo, whatsappLink } from '../../contexts/BusinessInfoContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const business = useBusinessInfo();

  return (
    <footer className="bg-dark-900 text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-warm rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🍔</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{business.name}</h3>
                <p className="text-gray-400 text-sm">{business.slogan}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Desde 2020, llevamos el sabor más auténtico de las hamburguesas a tu mesa. 
              Calidad, frescura y sabor en cada bocado.
            </p>
            <div className="flex space-x-4">
              {business.facebookUrl && (
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-gray-400 hover:text-white transition-colors">
                  Nuestro Menú
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="text-gray-400 hover:text-white transition-colors">
                  Pedir Ahora
                </Link>
              </li>
              <li>
                <Link href="/galeria" className="text-gray-400 hover:text-white transition-colors">
                  Galería
                </Link>
              </li>
              <li>
                <Link href="/opiniones" className="text-gray-400 hover:text-white transition-colors">
                  Opiniones
                </Link>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-white">{business.phone}</p>
                  <p className="text-gray-400 text-sm">Llamadas y WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-white">{business.email}</p>
                  <p className="text-gray-400 text-sm">Email</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-white">{business.address}</p>
                  <p className="text-gray-400 text-sm">{business.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Horarios</h4>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-secondary-500" />
              <p className="text-white">{business.openingHours}</p>
            </div>

            <div className="pt-4">
              <a
                href={whatsappLink(business)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center space-x-2 w-full"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} {business.name}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/politicas" className="text-gray-400 hover:text-white transition-colors">
                Políticas de Privacidad
              </Link>
              <Link href="/terminos" className="text-gray-400 hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

