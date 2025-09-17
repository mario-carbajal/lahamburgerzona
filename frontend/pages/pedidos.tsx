import React, { useState } from 'react';
import Head from 'next/head';
import { Plus, Minus, Trash2, ShoppingCart, User, MapPin, Clock, Phone } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

const PedidosPage = () => {
  const { state, updateQuantity, removeFromCart } = useCart();
  const cartItems = state.items;
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpdateQuantity = (id: string, change: number) => {
    const currentItem = cartItems.find(item => item.id === id);
    if (currentItem) {
      const newQuantity = currentItem.quantity + change;
      if (newQuantity <= 0) {
        removeFromCart(id);
      } else {
        updateQuantity(id, newQuantity);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 200 ? 0 : 30;
  const tax = subtotal * 0.16;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    // Simular proceso de checkout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: Integrar con WhatsApp o pasarela de pago
    const message = `🍔 *Nuevo Pedido - La Hamburguezona*

*Cliente:* ${customerInfo.name}
*Teléfono:* ${customerInfo.phone}
*Dirección:* ${customerInfo.address}
${customerInfo.notes ? `*Notas:* ${customerInfo.notes}` : ''}

*Pedido:*
${cartItems.map(item => `• ${item.name} x${item.quantity} - $${item.price * item.quantity}`).join('\n')}

*Resumen:*
Subtotal: $${subtotal}
Envío: $${deliveryFee}
IVA (16%): $${tax.toFixed(2)}
*Total: $${total.toFixed(2)}*

¡Gracias por elegir La Hamburguezona! 🍔`;

    const whatsappUrl = `https://wa.me/525550123?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setIsCheckingOut(false);
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Head>
          <title>Pedidos - La Hamburguezona</title>
          <meta name="description" content="Haz tu pedido online en La Hamburguezona. Rápido, fácil y delicioso." />
        </Head>

        <section className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-gray-600 mb-8">
              Explora nuestro delicioso menú y agrega tus hamburguesas favoritas al carrito.
            </p>
            <Link href="/menu">
              <button className="btn-primary text-lg px-8 py-4">
                Ver Menú
              </button>
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Pedidos - La Hamburguezona</title>
        <meta name="description" content="Haz tu pedido online en La Hamburguezona. Rápido, fácil y delicioso." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-gradient-warm py-12">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Finalizar Pedido
            </h1>
            <p className="text-xl text-white/90">
              Revisa tu pedido y completa tus datos para recibir tu orden
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cart Items */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tu Pedido ({cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'})
                </h2>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">Deliciosa hamburguesa de La Hamburguezona</p>
                        <p className="text-lg font-bold text-primary-500">${item.price}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link href="/menu">
                    <button className="btn-outline w-full">
                      Agregar Más Items
                    </button>
                  </Link>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Información de Entrega
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+52 555-0123"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de entrega *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Calle, número, colonia, ciudad..."
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Instrucciones especiales, referencias, etc."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Resumen del Pedido
                </h2>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                      <p className="font-semibold">${item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (16%)</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary-500 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {subtotal < 200 && (
                  <div className="mt-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <p className="text-sm text-secondary-700">
                      💡 ¡Agrega $${(200 - subtotal).toFixed(2)} más para envío gratis!
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleCheckout}
                    disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address || isCheckingOut}
                    className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Phone className="w-5 h-5 mr-2" />
                        Continuar por WhatsApp
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Al continuar, serás redirigido a WhatsApp para completar tu pedido
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PedidosPage;

