import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Star, Clock, Flame, X, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import { MenuItem } from '../../services/api';

interface BurgerCardProps {
  burger: MenuItem;
  onAddToCart: (burger: MenuItem) => void;
}

const BurgerCard: React.FC<BurgerCardProps> = ({ burger, onAddToCart }) => {
  const { getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(burger.id);
  const [showDetail, setShowDetail] = useState(false);
  return (
    <>
    <div className="burger-card group cursor-pointer" onClick={() => setShowDetail(true)}>
      <div className="relative overflow-hidden rounded-xl mb-4">
        <Image
          src={getImageUrl(burger.image)}
          alt={burger.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay con hint de "ver detalle" al pasar el mouse */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Eye className="w-3.5 h-3.5" />
            Ver detalle
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {burger.is_popular && (
            <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              ⭐ Popular
            </span>
          )}
          {burger.is_spicy && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <Flame className="w-3 h-3" />
              <span>Picante</span>
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 shadow-sm">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-xs font-semibold">{burger.rating}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-500 transition-colors">
            {burger.name}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {burger.description}
          </p>
        </div>

        {/* Ingredients */}
        <div className="flex flex-wrap gap-1">
          {(burger.ingredients || []).slice(0, 4).map((ingredient, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              {ingredient}
            </span>
          ))}
          {(burger.ingredients || []).length > 4 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              +{(burger.ingredients || []).length - 4} más
            </span>
          )}
        </div>

        {/* Time and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{burger.prep_time} min</span>
          </div>
          <div className="text-2xl font-bold text-primary-500">
            ${burger.price}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(burger);
          }}
          className="w-full btn-primary flex items-center justify-center space-x-2 group-hover:bg-primary-600 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>
            {currentQuantity > 0 ? `Agregar más (${currentQuantity})` : 'Agregar al Carrito'}
          </span>
        </button>
      </div>
    </div>

    {showDetail && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
        onClick={() => setShowDetail(false)}
      >
        <div
          className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <Image
              src={getImageUrl(burger.image)}
              alt={burger.name}
              width={600}
              height={350}
              className="w-full h-64 object-cover rounded-t-xl"
            />
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              {burger.is_popular && (
                <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  ⭐ Popular
                </span>
              )}
              {burger.is_spicy && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                  <Flame className="w-3 h-3" />
                  <span>Picante</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{burger.name}</h2>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold">{burger.rating}</span>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed">{burger.description}</p>

            {(burger.ingredients || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ingredientes</h3>
                <div className="flex flex-wrap gap-1">
                  {(burger.ingredients || []).map((ingredient, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{burger.prep_time} min</span>
              </div>
              <div className="text-2xl font-bold text-primary-500">
                ${burger.price}
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(burger);
                setShowDetail(false);
              }}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>
                {currentQuantity > 0 ? `Agregar más (${currentQuantity})` : 'Agregar al Carrito'}
              </span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default BurgerCard;
