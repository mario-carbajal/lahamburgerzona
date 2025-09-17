import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Clock, MapPin } from 'lucide-react';

interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  showStats?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  description,
  image,
  ctaText = "¡Ordena Ahora!",
  ctaLink = "/pedidos",
  showStats = true
}) => {
  const stats = [
    { icon: Star, label: "4.8/5", description: "Calificación promedio" },
    { icon: Clock, label: "15 min", description: "Tiempo de entrega" },
    { icon: MapPin, label: "Zona Centro", description: "Área de cobertura" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={image}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <p className="text-secondary-400 text-lg font-medium tracking-wide uppercase">
                {subtitle}
              </p>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {title}
              </h1>
              <p className="text-xl text-gray-200 leading-relaxed max-w-lg">
                {description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={ctaLink}>
                <button className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 group">
                  <span>{ctaText}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/menu">
                <button className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900">
                  Ver Menú
                </button>
              </Link>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="grid grid-cols-3 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <stat.icon className="w-8 h-8 text-secondary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.label}</div>
                    <div className="text-sm text-gray-300">{stat.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image/Animation */}
          <div className="relative">
            <div className="relative z-10 animate-float">
              <Image
                src="/images/hero-burger.png"
                alt="Delicious Burger"
                width={500}
                height={500}
                className="w-full max-w-lg mx-auto"
                priority
              />
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-10 -left-10 w-20 h-20 bg-secondary-500/20 rounded-full animate-pulse-slow" />
            <div className="absolute bottom-20 -right-10 w-16 h-16 bg-primary-500/20 rounded-full animate-bounce-slow" />
            <div className="absolute top-1/2 -left-5 w-12 h-12 bg-yellow-400/20 rounded-full animate-pulse-slow" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;

