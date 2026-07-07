import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Camera, Heart, Share2, Filter } from 'lucide-react';

// Datos de ejemplo para la galería
const galleryImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop',
    alt: 'Monstruo Clásico',
    title: 'Monstruo Clásico',
    category: 'hamburguesas',
    likes: 124,
    description: 'Nuestra hamburguesa estrella con ingredientes frescos'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format&fit=crop',
    alt: 'Zona BBQ',
    title: 'Zona BBQ',
    category: 'hamburguesas',
    likes: 98,
    description: 'Deliciosa hamburguesa con salsa BBQ casera'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80&auto=format&fit=crop',
    alt: 'Combo Brutal',
    title: 'Combo Brutal',
    category: 'hamburguesas',
    likes: 156,
    description: 'Para los más hambrientos, doble sabor'
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80&auto=format&fit=crop',
    alt: 'Interior del restaurante',
    title: 'Nuestro Local',
    category: 'restaurante',
    likes: 87,
    description: 'Ambiente acogedor y familiar'
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80&auto=format&fit=crop',
    alt: 'Cocina abierta',
    title: 'Cocina Abierta',
    category: 'restaurante',
    likes: 112,
    description: 'Preparamos tus hamburguesas frente a ti'
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
    alt: 'Ambiente del restaurante',
    title: 'Nuestro Ambiente',
    category: 'equipo',
    likes: 203,
    description: 'Un espacio pensado para disfrutar en familia o con amigos'
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop',
    alt: 'Papas fritas',
    title: 'Papas Deluxe',
    category: 'extras',
    likes: 76,
    description: 'Papas fritas crujientes y doradas'
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800&q=80&auto=format&fit=crop',
    alt: 'Malteadas',
    title: 'Malteadas Premium',
    category: 'bebidas',
    likes: 94,
    description: 'Malteadas cremosas de diferentes sabores'
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80&auto=format&fit=crop',
    alt: 'Zona Picante',
    title: 'Zona Picante',
    category: 'hamburguesas',
    likes: 145,
    description: 'Para los amantes del picante'
  }
];

const categories = [
  { id: 'all', name: 'Todas', count: galleryImages.length },
  { id: 'hamburguesas', name: 'Hamburguesas', count: galleryImages.filter(img => img.category === 'hamburguesas').length },
  { id: 'restaurante', name: 'Restaurante', count: galleryImages.filter(img => img.category === 'restaurante').length },
  { id: 'equipo', name: 'Equipo', count: galleryImages.filter(img => img.category === 'equipo').length },
  { id: 'extras', name: 'Extras', count: galleryImages.filter(img => img.category === 'extras').length },
  { id: 'bebidas', name: 'Bebidas', count: galleryImages.filter(img => img.category === 'bebidas').length }
];

const GaleriaPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredImages = activeCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  return (
    <>
      <Head>
        <title>Galería - La Hamburguezona</title>
        <meta name="description" content="Descubre nuestra galería de hamburguesas, ambiente y momentos especiales en La Hamburguezona." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-warm py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Nuestra Galería
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Descubre el sabor visual de La Hamburguezona. Cada imagen cuenta una historia de sabor y calidad.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-4">
                      <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {categories.find(cat => cat.id === image.category)?.name}
                    </span>
                  </div>

                  {/* Likes */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{image.likes}</span>
                    </span>
                  </div>
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {image.title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {image.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Camera className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay imágenes en esta categoría
              </h3>
              <p className="text-gray-600">
                Pronto agregaremos más contenido a esta sección.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-500 mb-2">
                {galleryImages.length}+
              </div>
              <div className="text-gray-600">Imágenes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500 mb-2">
                {galleryImages.reduce((sum, img) => sum + img.likes, 0)}+
              </div>
              <div className="text-gray-600">Me Gusta</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500 mb-2">
                {categories.length - 1}
              </div>
              <div className="text-gray-600">Categorías</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal para imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={800}
              height={600}
              className="rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white font-semibold text-xl mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-white/80">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GaleriaPage;