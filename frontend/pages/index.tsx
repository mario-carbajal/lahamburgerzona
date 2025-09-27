import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DynamicHero from '../components/UI/DynamicHero';
import BurgerCard from '../components/Menu/BurgerCard';
import { useCart } from '../contexts/CartContext';
import { Star, Clock, Users, Award } from 'lucide-react';
import apiService, { MenuItem } from '../services/api';

const features = [
  {
    icon: Clock,
    title: 'Entrega Rápida',
    description: 'Llegamos en 15-30 minutos a tu ubicación'
  },
  {
    icon: Star,
    title: 'Calidad Premium',
    description: 'Ingredientes frescos y de la mejor calidad'
  },
  {
    icon: Users,
    title: 'Atención Personalizada',
    description: 'Servicio al cliente excepcional'
  },
  {
    icon: Award,
    title: 'Reconocidos',
    description: 'Mejor hamburguesería de la zona 2023'
  }
];

const testimonials = [
  {
    name: 'María González',
    rating: 5,
    comment: 'Las mejores hamburguesas de la ciudad. El sabor es increíble y la atención es excelente.',
    image: '/images/testimonials/maria.jpg'
  },
  {
    name: 'Carlos Ruiz',
    rating: 5,
    comment: 'Siempre pido aquí. La rapidez en la entrega y la calidad de los ingredientes es insuperable.',
    image: '/images/testimonials/carlos.jpg'
  },
  {
    name: 'Ana Martínez',
    rating: 5,
    comment: 'El Monstruo Clásico es mi favorita. Cada bocado es una explosión de sabor.',
    image: '/images/testimonials/ana.jpg'
  }
];

const HomePage = () => {
  const { addToCart } = useCart();
  const [featuredBurgers, setFeaturedBurgers] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedBurgers();
  }, []);

  const loadFeaturedBurgers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMenuItems();
      if (response.success && response.data) {
        // Filtrar hamburguesas populares
        const popularBurgers = response.data
          .filter((item: MenuItem) => item.is_popular && item.is_active);
        
        // Si hay menos de 3 populares, completar con las mejor calificadas
        if (popularBurgers.length < 3) {
          const remainingSlots = 3 - popularBurgers.length;
          const popularIds = popularBurgers.map(burger => burger.id);
          
          const topRatedBurgers = response.data
            .filter((item: MenuItem) => item.is_active && !popularIds.includes(item.id))
            .sort((a: MenuItem, b: MenuItem) => b.rating - a.rating)
            .slice(0, remainingSlots);
          
          // Combinar populares con mejor calificadas
          const combinedBurgers = [...popularBurgers, ...topRatedBurgers];
          console.log('🍔 Hamburguesas destacadas cargadas:', {
            populares: popularBurgers.map(b => ({ id: b.id, name: b.name, rating: b.rating })),
            topRated: topRatedBurgers.map(b => ({ id: b.id, name: b.name, rating: b.rating })),
            combinadas: combinedBurgers.map(b => ({ id: b.id, name: b.name, rating: b.rating }))
          });
          setFeaturedBurgers(combinedBurgers);
        } else {
          // Si hay 3 o más populares, tomar solo las primeras 3
          const finalBurgers = popularBurgers.slice(0, 3);
          console.log('🍔 Solo hamburguesas populares:', finalBurgers.map(b => ({ id: b.id, name: b.name, rating: b.rating })));
          setFeaturedBurgers(finalBurgers);
        }
      }
    } catch (error) {
      console.error('Error loading featured burgers:', error);
      // En caso de error, usar datos de fallback
      setFeaturedBurgers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (burger: MenuItem) => {
    addToCart({
      id: burger.id,
      name: burger.name,
      price: burger.price,
      image: burger.image
    });
  };

  return (
    <>
      <Head>
        <title>La Hamburguezona - ¡Sabor que conquista!</title>
        <meta name="description" content="Disfruta de las mejores hamburguesas en La Hamburguezona. Menú variado, ingredientes frescos y sabor auténtico. ¡Ordena ahora!" />
      </Head>

      {/* Hero Section */}
      <DynamicHero showStats={true} autoSlide={true} slideInterval={6000} />

      {/* Features Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir La Hamburguezona?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nos comprometemos a brindarte la mejor experiencia gastronómica con ingredientes de calidad y servicio excepcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Burgers Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestras Hamburguesas Estrella
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre las hamburguesas más populares de nuestro menú, preparadas con ingredientes premium y mucho amor.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando nuestras hamburguesas estrella...</p>
              </div>
            </div>
          ) : featuredBurgers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredBurgers.map((burger) => (
                  <BurgerCard
                    key={burger.id}
                    burger={burger}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              <div className="text-center mt-12">
                <a href="/menu" className="btn-primary text-lg px-8 py-4">
                  Ver Todo el Menú
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Próximamente más hamburguesas
              </h3>
              <p className="text-gray-600 mb-6">
                Estamos preparando las mejores hamburguesas para ti.
              </p>
              <a href="/menu" className="btn-primary text-lg px-8 py-4">
                Ver Menú Completo
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-warm">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Miles de clientes satisfechos respaldan nuestra calidad y sabor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-white/70 text-sm">Cliente verificado</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-dark-900">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para probar el mejor sabor?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Ordena ahora y disfruta de nuestras hamburguesas premium en la comodidad de tu hogar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/pedidos" className="btn-primary text-lg px-8 py-4">
              ¡Ordena Ahora!
            </a>
            <a href="/contacto" className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900">
              Contáctanos
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
