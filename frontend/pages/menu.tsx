import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BurgerCard from '../components/Menu/BurgerCard';
import { useCart } from '../contexts/CartContext';
import { Search, Filter, Star } from 'lucide-react';
import apiService from '../services/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  prepTime: number;
  isPopular?: boolean;
  isSpicy?: boolean;
  ingredients: string[];
}

interface MenuData {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  items: MenuItem[];
}

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('Monstruo Clásico');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMenuItems();
      if (response.success) {
        setMenuData(response.data);
        // Set the first available category as active
        if (response.data.items.length > 0) {
          const firstCategory = response.data.items[0].category;
          setActiveCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Menú - La Hamburguezona</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando menú...</p>
          </div>
        </div>
      </>
    );
  }

  if (!menuData) {
    return (
      <>
        <Head>
          <title>Menú - La Hamburguezona</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar el menú</h2>
            <p className="text-gray-600">Por favor, intenta de nuevo más tarde.</p>
          </div>
        </div>
      </>
    );
  }

  // Get categories from the API response
  const categories = menuData.categories.map(cat => cat.name);

  const handleAddToCart = (burger: any) => {
    addToCart({
      id: burger.id,
      name: burger.name,
      price: burger.price,
      image: burger.image
    });
  };

  const filteredItems = menuData.items
    .filter(item => item.category === activeCategory)
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'prep-time':
          return a.prepTime - b.prepTime;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <>
      <Head>
        <title>Menú - La Hamburguezona</title>
        <meta name="description" content="Descubre nuestro delicioso menú de hamburguesas, bebidas y extras. Calidad premium y sabor auténtico en cada bocado." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-warm py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Nuestro Menú
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Descubre todas nuestras deliciosas opciones, preparadas con ingredientes frescos y mucho amor.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar en el menú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Nombre</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="rating">Calificación</option>
                <option value="prep-time">Tiempo de preparación</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-6 bg-white border-b">
        <div className="container-custom">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {activeCategory}
            </h2>
            <p className="text-gray-600">
              {filteredItems.length} {filteredItems.length === 1 ? 'opción' : 'opciones'} disponible{filteredItems.length === 1 ? '' : 's'}
            </p>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <BurgerCard
                  key={item.id}
                  burger={item}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 mb-6">
                Intenta con otros términos de búsqueda o explora nuestras categorías.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="btn-primary"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-dark-900">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para ordenar?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Ve a la sección de pedidos y arma tu orden perfecta.
          </p>
          <a href="/pedidos" className="btn-primary text-lg px-8 py-4">
            Hacer Pedido
          </a>
        </div>
      </section>
    </>
  );
};

export default MenuPage;
