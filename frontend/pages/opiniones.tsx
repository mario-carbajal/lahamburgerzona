import React, { useState } from 'react';
import Head from 'next/head';
import { Star, Quote, ThumbsUp, MessageCircle, Filter, SortAsc } from 'lucide-react';

// Datos de ejemplo para las opiniones
const reviews = [
  {
    id: 1,
    name: 'María González',
    rating: 5,
    date: '2024-01-15',
    comment: 'Las mejores hamburguesas de la ciudad. El sabor es increíble y la atención es excelente. Definitivamente regresaré.',
    verified: true,
    helpful: 23,
    order: 'Monstruo Clásico + Papas'
  },
  {
    id: 2,
    name: 'Carlos Ruiz',
    rating: 5,
    date: '2024-01-14',
    comment: 'Siempre pido aquí. La rapidez en la entrega y la calidad de los ingredientes es insuperable. ¡100% recomendado!',
    verified: true,
    helpful: 18,
    order: 'Zona BBQ + Combo'
  },
  {
    id: 3,
    name: 'Ana Martínez',
    rating: 4,
    date: '2024-01-13',
    comment: 'El Monstruo Clásico es mi favorita. Cada bocado es una explosión de sabor. Solo mejoraría el tiempo de espera.',
    verified: true,
    helpful: 15,
    order: 'Monstruo Clásico'
  },
  {
    id: 4,
    name: 'Roberto Silva',
    rating: 5,
    date: '2024-01-12',
    comment: 'Increíble experiencia gastronómica. Las hamburguesas están perfectamente cocidas y los ingredientes son frescos. El personal es muy amable.',
    verified: false,
    helpful: 12,
    order: 'Brutal Doble'
  },
  {
    id: 5,
    name: 'Laura Jiménez',
    rating: 5,
    date: '2024-01-11',
    comment: 'Me encanta que usen ingredientes locales y frescos. Se nota la diferencia en el sabor. ¡Volveré pronto!',
    verified: true,
    helpful: 20,
    order: 'Zona Mediterránea'
  },
  {
    id: 6,
    name: 'Diego Herrera',
    rating: 4,
    date: '2024-01-10',
    comment: 'Buenas hamburguesas, buen precio. La única queja es que a veces tardan un poco en entregar, pero vale la pena esperar.',
    verified: false,
    helpful: 8,
    order: 'Combo Monstruo'
  },
  {
    id: 7,
    name: 'Carmen Vega',
    rating: 5,
    date: '2024-01-09',
    comment: 'Excelente servicio al cliente. Me ayudaron con mi pedido especial y todo salió perfecto. ¡Gracias!',
    verified: true,
    helpful: 25,
    order: 'Pedido personalizado'
  },
  {
    id: 8,
    name: 'Miguel Torres',
    rating: 5,
    date: '2024-01-08',
    comment: 'La mejor hamburguesería del área. Calidad premium a precios justos. El ambiente es muy acogedor.',
    verified: true,
    helpful: 16,
    order: 'Zona Picante + Extras'
  }
];

const stats = {
  totalReviews: reviews.length,
  averageRating: 4.8,
  ratingDistribution: {
    5: 75,
    4: 20,
    3: 3,
    2: 1,
    1: 1
  }
};

const OpinionesPage = () => {
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      case 'recent':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const filteredReviews = filterRating === 'all' 
    ? sortedReviews 
    : sortedReviews.filter(review => review.rating === parseInt(filterRating));

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <>
      <Head>
        <title>Opiniones - La Hamburguezona</title>
        <meta name="description" content="Lee las opiniones de nuestros clientes y descubre por qué La Hamburguezona es la mejor opción para hamburguesas." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-warm py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Opiniones de Nuestros Clientes
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Descubre lo que dicen nuestros clientes sobre La Hamburguezona. 
            Tu opinión es muy importante para nosotros.
          </p>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar con estadísticas */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Resumen de Calificaciones
              </h2>

              {/* Rating promedio */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary-500 mb-2">
                  {stats.averageRating}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-gray-600">
                  Basado en {stats.totalReviews} opiniones
                </div>
              </div>

              {/* Distribución de ratings */}
              <div className="space-y-3 mb-6">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${stats.ratingDistribution[rating]}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {stats.ratingDistribution[rating]}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por calificación
                  </label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Todas las calificaciones</option>
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas</option>
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="rating">Mejor calificación</option>
                    <option value="helpful">Más útiles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de opiniones */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Opiniones ({filteredReviews.length})
              </h2>
            </div>

            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-lg">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {review.name}
                          </h3>
                          {review.verified && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              ✓ Verificado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Pedido:</span> {review.order}
                    </div>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-500 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">Útil ({review.helpful})</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-500 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Responder</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Star className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay opiniones con estos filtros
                </h3>
                <p className="text-gray-600">
                  Intenta cambiar los filtros para ver más opiniones.
                </p>
              </div>
            )}

            {/* CTA para escribir opinión */}
            <div className="mt-12 bg-primary-50 border border-primary-200 p-8 rounded-xl text-center">
              <Quote className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Ya probaste nuestras hamburguesas?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Comparte tu experiencia con otros clientes y ayúdanos a mejorar. 
                Tu opinión es muy valiosa para nosotros.
              </p>
              <button className="btn-primary text-lg px-8 py-4">
                Escribir una Opinión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpinionesPage;