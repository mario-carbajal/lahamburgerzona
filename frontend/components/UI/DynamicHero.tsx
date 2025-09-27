import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService, { HeroImage } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

interface DynamicHeroProps {
  showStats?: boolean;
  autoSlide?: boolean;
  slideInterval?: number;
}

const DynamicHero: React.FC<DynamicHeroProps> = ({
  showStats = true,
  autoSlide = true,
  slideInterval = 5000
}) => {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHeroImages();
  }, []);

  useEffect(() => {
    if (autoSlide && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, slideInterval);

      return () => clearInterval(interval);
    }
  }, [autoSlide, heroImages.length, slideInterval]);

  const loadHeroImages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getHeroImages();
      if (response.success && response.data.length > 0) {
        setHeroImages(response.data);
      }
    } catch (error) {
      console.error('Error loading hero images:', error);
      // Fallback a datos estáticos si falla la carga
      setHeroImages([{
        id: 'fallback',
        title: '¡Sabor que conquista!',
        subtitle: 'Bienvenido a',
        description: 'Descubre el sabor auténtico de las mejores hamburguesas de la ciudad. Ingredientes frescos, preparación artesanal y un sabor que te conquistará desde el primer bocado.',
        imageUrl: '/images/hero-bg.jpg',
        ctaText: '¡Ordena Ahora!',
        ctaLink: '/pedidos',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const stats = [
    { icon: Star, label: "4.8/5", description: "Calificación promedio" },
    { icon: Clock, label: "15 min", description: "Tiempo de entrega" },
    { icon: MapPin, label: "Zona Centro", description: "Área de cobertura" },
  ];

  if (isLoading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-white">Cargando...</p>
        </div>
      </section>
    );
  }

  if (heroImages.length === 0) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">¡Sabor que conquista!</h1>
          <p className="text-xl mb-8">Bienvenido a La Hamburguezona</p>
          <Link href="/pedidos">
            <button className="btn-primary text-lg px-8 py-4">
              ¡Ordena Ahora!
            </button>
          </Link>
        </div>
      </section>
    );
  }

  const currentHero = heroImages[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={getImageUrl(currentHero.imageUrl)}
          alt={currentHero.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Navigation Arrows */}
      {heroImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              {currentHero.subtitle && (
                <p className="text-secondary-400 text-lg font-medium tracking-wide uppercase">
                  {currentHero.subtitle}
                </p>
              )}
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {currentHero.title}
              </h1>
              {currentHero.description && (
                <p className="text-xl text-gray-200 leading-relaxed max-w-lg">
                  {currentHero.description}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={currentHero.ctaLink}>
                <button className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 group">
                  <span>{currentHero.ctaText}</span>
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

      {/* Slide Indicators */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default DynamicHero;
