import React from 'react';
import Image from 'next/image';
import { Plus, Star, Clock, Flame } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';

interface Burger {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  prepTime: number;
  isSpicy?: boolean;
  isPopular?: boolean;
  ingredients: string[];
}

interface BurgerCardProps {
  burger: Burger;
  onAddToCart: (burger: Burger) => void;
}

const BurgerCard: React.FC<BurgerCardProps> = ({ burger, onAddToCart }) => {
  const { getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(burger.id);
  return (
    <div className="burger-card group">
      <div className="relative overflow-hidden rounded-lg mb-4">
        <Image
          src={getImageUrl(burger.image)}
          alt={burger.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {burger.isPopular && (
            <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              ⭐ Popular
            </span>
          )}
          {burger.isSpicy && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
              <Flame className="w-3 h-3" />
              <span>Picante</span>
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
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
          {burger.ingredients.slice(0, 4).map((ingredient, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              {ingredient}
            </span>
          ))}
          {burger.ingredients.length > 4 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              +{burger.ingredients.length - 4} más
            </span>
          )}
        </div>

        {/* Time and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{burger.prepTime} min</span>
          </div>
          <div className="text-2xl font-bold text-primary-500">
            ${burger.price}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(burger)}
          className="w-full btn-primary flex items-center justify-center space-x-2 group-hover:bg-primary-600 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>
            {currentQuantity > 0 ? `Agregar más (${currentQuantity})` : 'Agregar al Carrito'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BurgerCard;
