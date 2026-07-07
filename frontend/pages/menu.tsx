import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BurgerCard from '../components/Menu/BurgerCard';
import ExtrasPicker from '../components/Menu/ExtrasPicker';
import { useCart } from '../contexts/CartContext';
import type { CartExtra } from '../contexts/CartContext';
import type { MenuExtra } from '../services/api';
import {
  Search,
  X,
  Star,
  Flame,
  ChevronDown,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import apiService, { MenuItem } from '../services/api';

// Categoría "virtual" que agrupa todos los productos, sin importar su categoría real
const ALL_CATEGORY = '__TODOS__';

// Metadatos visuales de las categorías reales del negocio (mismas que usa
// el panel admin en pages/admin/menu.tsx). Si el backend trae una categoría
// que no está aquí, se usa DEFAULT_CATEGORY_META para que la pantalla nunca
// se rompa ni oculte productos.
const CATEGORY_META: Record<string, { icon: string; description: string }> = {
  'Monstruo Clásico': {
    icon: '🍔',
    description: 'Nuestras hamburguesas insignia, preparadas al momento con ingredientes frescos.',
  },
  'Zona Sabor': {
    icon: '🌶️',
    description: 'Combinaciones y sabores especiales para paladares aventureros.',
  },
  'Combos Brutales': {
    icon: '🍽️',
    description: 'Combos completos para compartir o para el hambre más grande.',
  },
  Bebidas: {
    icon: '🥤',
    description: 'Refrescantes bebidas para acompañar tu comida.',
  },
  Extras: {
    icon: '🍟',
    description: 'Papas, aros de cebolla y más para complementar tu orden.',
  },
};

const DEFAULT_CATEGORY_META = {
  icon: '🍽️',
  description: 'Deliciosas opciones preparadas con mucho amor.',
};

const KNOWN_CATEGORY_ORDER = Object.keys(CATEGORY_META);

const MenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlySpicy, setOnlySpicy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await apiService.getMenuItems({ activo: true });
      if (response.ok) {
        setItems(response.data || []);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Categorías reales derivadas de los productos cargados (con conteo por categoría).
  // Se calculan dinámicamente en vez de usar una lista fija para que ninguna categoría
  // nueva del backend quede "invisible" en las pestañas.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    });
    const names = Array.from(counts.keys());
    names.sort((a, b) => {
      const ia = KNOWN_CATEGORY_ORDER.indexOf(a);
      const ib = KNOWN_CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return names.map((name) => ({ name, count: counts.get(name) || 0 }));
  }, [items]);

  const avgRating = useMemo(() => {
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
  }, [items]);

  const [extrasTarget, setExtrasTarget] = useState<{ item: MenuItem; extras: MenuExtra[] } | null>(null);

  const agregarConExtras = (burger: MenuItem, extras: CartExtra[]) => {
    addToCart({
      menuItemId: Number(burger.id),
      name: burger.name,
      price: Number(burger.price) + extras.reduce((s, e) => s + e.price, 0),
      image: burger.image || '',
      extras: extras.length > 0 ? extras : undefined,
    });
    toast.success(`${burger.name} se agregó al carrito`);
    setExtrasTarget(null);
  };

  const handleAddToCart = async (burger: MenuItem) => {
    // Si el producto tiene extras configurados, se le pregunta al cliente primero
    try {
      const res = await apiService.getExtras(burger.id);
      if (res.ok && res.data.length > 0) {
        setExtrasTarget({ item: burger, extras: res.data });
        return;
      }
    } catch {
      // si la consulta de extras falla, se agrega sin extras
    }
    agregarConExtras(burger, []);
  };

  const filteredItems = items
    .filter((item) => activeCategory === ALL_CATEGORY || item.category === activeCategory)
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => (onlyPopular ? item.is_popular : true))
    .filter((item) => (onlySpicy ? item.is_spicy : true))
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'prep-time':
          return a.prep_time - b.prep_time;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const hasActiveFilters = searchTerm !== '' || onlyPopular || onlySpicy;

  const clearFilters = () => {
    setSearchTerm('');
    setOnlyPopular(false);
    setOnlySpicy(false);
  };

  const activeMeta =
    activeCategory === ALL_CATEGORY
      ? { icon: '🍽️', description: 'Explora todas nuestras opciones disponibles, sin importar la categoría.' }
      : CATEGORY_META[activeCategory] ?? DEFAULT_CATEGORY_META;

  return (
    <>
      <Head>
        <title>Menú - La Hamburguezona</title>
        <meta
          name="description"
          content="Descubre nuestro delicioso menú de hamburguesas, bebidas y extras. Calidad premium y sabor auténtico en cada bocado."
        />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-gradient-warm py-16 md:py-24 overflow-hidden">
        <div className="absolute top-8 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl animate-bounce-slow" />

        <div className="container-custom relative z-10 text-center">
          <span className="inline-block text-5xl mb-3">🍔</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nuestro Menú</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            Descubre todas nuestras deliciosas opciones, preparadas con ingredientes frescos y mucho amor.
          </p>

          {!isLoading && !hasError && items.length > 0 && (
            <div className="mt-10 flex flex-wrap justify-center gap-8 sm:gap-14">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{items.length}</div>
                <div className="text-sm text-white/80">{items.length === 1 ? 'Platillo' : 'Platillos'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categories.length}</div>
                <div className="text-sm text-white/80">
                  {categories.length === 1 ? 'Categoría' : 'Categorías'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  {avgRating.toFixed(1)}
                  <Star className="w-5 h-5 fill-current text-yellow-300" />
                </div>
                <div className="text-sm text-white/80">Calificación</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <MenuSkeleton />
      ) : hasError ? (
        <section className="section-padding">
          <div className="container-custom text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se pudo cargar el menú</h3>
            <p className="text-gray-600 mb-6">
              Ocurrió un problema al conectar con nuestro servidor. Intenta de nuevo en unos segundos.
            </p>
            <button onClick={loadMenuData} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Reintentar
            </button>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="section-padding">
          <div className="container-custom text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-secondary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no hay productos publicados</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Estamos preparando nuestro menú. Vuelve pronto para descubrir nuestras hamburguesas.
            </p>
            <a href="/" className="btn-primary">
              Volver al inicio
            </a>
          </div>
        </section>
      ) : (
        <>
          {/* Filters Section */}
          <section className="py-8 bg-gray-50">
            <div className="container-custom">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar en el menú..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Buscar en el menú"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Quick toggles */}
                    <button
                      onClick={() => setOnlyPopular((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                        onlyPopular
                          ? 'bg-secondary-500 border-secondary-500 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-secondary-300 hover:text-secondary-600'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${onlyPopular ? 'fill-current' : ''}`} />
                      Populares
                    </button>
                    <button
                      onClick={() => setOnlySpicy((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                        onlySpicy
                          ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                      }`}
                    >
                      <Flame className={`w-4 h-4 ${onlySpicy ? 'fill-current' : ''}`} />
                      Picante
                    </button>

                    {/* Sort */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 font-medium text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                        aria-label="Ordenar por"
                      >
                        <option value="name">Nombre</option>
                        <option value="price-low">Precio: Menor a Mayor</option>
                        <option value="price-high">Precio: Mayor a Menor</option>
                        <option value="rating">Calificación</option>
                        <option value="prep-time">Tiempo de preparación</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Active filters */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                    <span className="text-sm text-gray-500 pt-2">Filtros activos:</span>
                    {searchTerm && (
                      <span className="mt-2 inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                        &quot;{searchTerm}&quot;
                        <button onClick={() => setSearchTerm('')} aria-label="Quitar filtro de búsqueda">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {onlyPopular && (
                      <span className="mt-2 inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                        Populares
                        <button onClick={() => setOnlyPopular(false)} aria-label="Quitar filtro de populares">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {onlySpicy && (
                      <span className="mt-2 inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                        Picante
                        <button onClick={() => setOnlySpicy(false)} aria-label="Quitar filtro de picante">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Category Tabs */}
          <section className="py-6 bg-white border-b">
            <div className="container-custom">
              <div className="flex flex-wrap gap-2.5 justify-center">
                <button
                  onClick={() => setActiveCategory(ALL_CATEGORY)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
                    activeCategory === ALL_CATEGORY
                      ? 'bg-gradient-warm text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span aria-hidden="true">🍽️</span>
                  <span>Todos</span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      activeCategory === ALL_CATEGORY ? 'bg-white/25' : 'bg-white text-gray-500'
                    }`}
                  >
                    {items.length}
                  </span>
                </button>
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat.name] ?? DEFAULT_CATEGORY_META;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span aria-hidden="true">{meta.icon}</span>
                      <span>{cat.name}</span>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          isActive ? 'bg-white/25' : 'bg-white text-gray-500'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Menu Items */}
          <section className="section-padding">
            <div className="container-custom">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl" aria-hidden="true">
                      {activeMeta.icon}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {activeCategory === ALL_CATEGORY ? 'Todo el menú' : activeCategory}
                    </h2>
                  </div>
                  <p className="text-gray-600 max-w-xl">{activeMeta.description}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full px-4 py-2 w-fit">
                  <UtensilsCrossed className="w-4 h-4" />
                  {filteredItems.length} {filteredItems.length === 1 ? 'opción disponible' : 'opciones disponibles'}
                </div>
              </div>

              {filteredItems.length > 0 ? (
                <motion.div
                  key={`${activeCategory}-${searchTerm}-${sortBy}-${onlyPopular}-${onlySpicy}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                    >
                      <BurgerCard burger={item} onAddToCart={handleAddToCart} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600 mb-6">
                    Intenta con otros términos de búsqueda, quita algún filtro o explora otra categoría.
                  </p>
                  <button onClick={clearFilters} className="btn-primary">
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* CTA Section */}
      <section className="section-padding bg-dark-900">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para ordenar?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Ve a la sección de pedidos y arma tu orden perfecta.
          </p>
          <a href="/pedidos" className="btn-primary text-lg px-8 py-4">
            Hacer Pedido
          </a>
        </div>
      </section>

      {/* Selector de extras del producto */}
      {extrasTarget && (
        <ExtrasPicker
          item={extrasTarget.item}
          extras={extrasTarget.extras}
          onConfirm={(extras) => agregarConExtras(extrasTarget.item, extras)}
          onClose={() => setExtrasTarget(null)}
        />
      )}
    </>
  );
};

// Estado de carga: réplica visual de la estructura real (filtros + pestañas + tarjetas)
// usando shimmer, en vez de un simple mensaje de "Cargando...".
const MenuSkeleton = () => (
  <>
    <section className="py-8 bg-gray-50">
      <div className="container-custom">
        <div className="h-20 bg-white rounded-2xl shadow-md border border-gray-100 animate-pulse" />
      </div>
    </section>
    <section className="py-6 bg-white border-b">
      <div className="container-custom">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 w-28 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </section>
    <section className="section-padding">
      <div className="container-custom">
        <div className="h-8 w-56 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-5/6 mb-4 animate-pulse" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded w-12 animate-pulse" />
              </div>
              <div className="h-11 bg-gray-200 rounded-lg w-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default MenuPage;
