import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Interfaces
export interface CartExtra {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // clave única de línea: producto + combinación de extras
  menuItemId: number;
  name: string;
  price: number; // precio unitario YA con extras incluidos
  image: string;
  quantity: number;
  extras?: CartExtra[];
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// La misma hamburguesa con distintos extras son líneas distintas del carrito
export const lineaId = (menuItemId: number | string, extras?: CartExtra[]) => {
  const base = String(menuItemId);
  if (!extras || extras.length === 0) return base;
  const ids = extras.map((e) => e.id).sort((a, b) => a - b).join('.');
  return `${base}-x${ids}`;
};

// Tipos de acciones
type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Estado inicial
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const conTotales = (items: CartItem[]): CartState => ({
  items,
  total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

// Reducer para manejar el estado del carrito
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        return conTotales(
          state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        );
      }
      return conTotales([...state.items, action.payload]);
    }

    case 'REMOVE_ITEM':
      return conTotales(state.items.filter(item => item.id !== action.payload));

    case 'UPDATE_QUANTITY':
      return conTotales(
        state.items
          .map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.max(0, action.payload.quantity) }
              : item
          )
          .filter(item => item.quantity > 0)
      );

    case 'CLEAR_CART':
      return initialState;

    case 'LOAD_CART':
      return conTotales(action.payload);

    default:
      return state;
  }
};

// Context
interface CartContextType {
  state: CartState;
  addToCart: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('hamburguezona-cart');
      if (savedCart) {
        const cartItems = (JSON.parse(savedCart) as CartItem[]).map((item) => ({
          ...item,
          // Migración de carritos guardados antes de los extras: el id era el
          // id del producto directamente
          menuItemId: item.menuItemId ?? Number(item.id),
        }));
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('hamburguezona-cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  // Funciones del contexto
  const addToCart: CartContextType['addToCart'] = (item) => {
    const id = item.id ?? lineaId(item.menuItemId, item.extras);
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id, quantity: 1 } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Cantidad total del producto en el carrito, sumando todas sus variantes de extras
  const getItemQuantity = (id: string): number =>
    state.items
      .filter(item => item.id === id || String(item.menuItemId) === id)
      .reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
