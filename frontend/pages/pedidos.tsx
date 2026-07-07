import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, Minus, Trash2, ShoppingCart, User, MapPin, Clock, Phone } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { useBusinessInfo, whatsappLink } from '../contexts/BusinessInfoContext';
import apiService from '../services/api';
import { getClienteSesion } from '../utils/clienteSession';

const PedidosPage = () => {
  const { state, updateQuantity, removeFromCart } = useCart();
  const business = useBusinessInfo();
  const cartItems = state.items;
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'mercadopago'>('whatsapp');

  // Cupón de descuento
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Puntos de lealtad
  const [puntos, setPuntos] = useState<{ points: number; valor_punto: number } | null>(null);
  const [puntosCanje, setPuntosCanje] = useState(0);
  const [isConsultandoPuntos, setIsConsultandoPuntos] = useState(false);

  // Pedido programado (vacío = lo antes posible)
  const [programado, setProgramado] = useState('');

  // Con sesión de cliente activa, el formulario se prellena con sus datos
  useEffect(() => {
    const sesion = getClienteSesion();
    if (!sesion) return;
    setCustomerInfo((prev) => ({
      ...prev,
      name: prev.name || sesion.customer.name,
      phone: prev.phone || sesion.customer.phone.replace(/\D/g, '').slice(-10),
      email: prev.email || sesion.customer.email,
      address: prev.address || sesion.customer.address || '',
    }));
    // Y sus puntos se consultan solos
    if (sesion.customer.loyalty_points > 0) {
      const digitos = sesion.customer.phone.replace(/\D/g, '').slice(-10);
      apiService
        .consultarPuntos(digitos)
        .then((res) => setPuntos({ points: res.data.points, valor_punto: res.data.valor_punto }))
        .catch(() => {});
    }
  }, []);

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

  const subtotalWithTax = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = coupon ? Math.min(coupon.discount, subtotalWithTax) : 0;
  const subtotalConDescuento = subtotalWithTax - discount;
  const valorPunto = puntos?.valor_punto || 1;
  const maxPuntosCanjeables = puntos
    ? Math.min(puntos.points, Math.floor(subtotalConDescuento / valorPunto))
    : 0;
  const puntosAplicados = Math.min(puntosCanje, maxPuntosCanjeables);
  const puntosDescuento = puntosAplicados * valorPunto;
  const baseFinal = subtotalConDescuento - puntosDescuento;
  const deliveryFee = baseFinal >= 200 ? 0 : 30;
  const subtotalWithoutTax = baseFinal / 1.16; // Desglosar IVA del subtotal
  const tax = baseFinal - subtotalWithoutTax; // IVA desglosado
  const total = baseFinal + deliveryFee;

  const consultarPuntos = async () => {
    const digitos = customerInfo.phone.replace(/\D/g, '');
    if (digitos.length !== 10) {
      alert('Captura primero tu teléfono de 10 dígitos en el formulario');
      return;
    }
    setIsConsultandoPuntos(true);
    try {
      const res = await apiService.consultarPuntos(digitos);
      setPuntos({ points: res.data.points, valor_punto: res.data.valor_punto });
      setPuntosCanje(0);
    } catch (error: any) {
      alert(error.message || 'No se pudo consultar el saldo de puntos');
    } finally {
      setIsConsultandoPuntos(false);
    }
  };

  const aplicarCupon = async () => {
    const codigo = couponInput.trim();
    if (!codigo) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await apiService.validateCoupon(codigo, subtotalWithTax);
      setCoupon({ code: res.data.code, discount: res.data.discount });
      setCouponInput('');
    } catch (error: any) {
      setCoupon(null);
      setCouponError(error.message || 'No se pudo validar el cupón');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const quitarCupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  // Funciones de validación
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Remover todos los caracteres no numéricos para validar
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validar que tenga exactamente 10 dígitos (formato mexicano)
    if (cleanPhone.length !== 10) {
      return false;
    }
    
    // Validar que no empiece con 0 o 1 (números inválidos en México)
    if (cleanPhone.startsWith('0') || cleanPhone.startsWith('1')) {
      return false;
    }
    
    // Validar que el primer dígito sea válido para México (2-9)
    const firstDigit = parseInt(cleanPhone[0]);
    return firstDigit >= 2 && firstDigit <= 9;
  };

  const formatPhone = (phone) => {
    // Remover todos los caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Si tiene 10 dígitos, formatear como (XXX) XXX-XXXX
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    }
    
    // Si tiene menos de 10 dígitos, devolver tal como está
    return phone;
  };

  const validateForm = () => {
    console.log('🔍 Validando formulario...');
    console.log('📝 Datos a validar:', customerInfo);
    
    const newErrors: any = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      console.log('❌ Nombre faltante');
    } else {
      console.log('✅ Nombre válido:', customerInfo.name);
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
      console.log('❌ Teléfono faltante');
    } else if (!validatePhone(customerInfo.phone)) {
      const cleanPhone = customerInfo.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos';
        console.log('❌ Teléfono inválido - longitud:', cleanPhone.length);
      } else if (cleanPhone.startsWith('0') || cleanPhone.startsWith('1')) {
        newErrors.phone = 'El teléfono no puede empezar con 0 o 1';
        console.log('❌ Teléfono inválido - empieza con:', cleanPhone[0]);
      } else {
        newErrors.phone = 'Ingresa un teléfono válido (ej: 5551234567)';
        console.log('❌ Teléfono inválido - formato incorrecto');
      }
    } else {
      console.log('✅ Teléfono válido:', customerInfo.phone);
    }

    if (customerInfo.email.trim() && !validateEmail(customerInfo.email)) {
      newErrors.email = 'Ingresa un email válido (ej: usuario@email.com)';
      console.log('❌ Email inválido:', customerInfo.email);
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'La dirección es requerida';
      console.log('❌ Dirección faltante');
    } else {
      console.log('✅ Dirección válida:', customerInfo.address);
    }

    console.log('📊 Errores encontrados:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🎯 Formulario válido:', isValid);
    return isValid;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, ''); // Solo permitir dígitos
    
    // Limitar a 10 dígitos máximo
    const limitedValue = value.slice(0, 10);
    
    setCustomerInfo({...customerInfo, phone: limitedValue});
    if (errors.phone) {
      setErrors({...errors, phone: ''});
    }
  };

  const handleCheckout = async () => {
    console.log('🛒 Iniciando proceso de checkout...');
    console.log('📋 Datos del cliente:', customerInfo);
    console.log('🛍️ Items en carrito:', cartItems);
    
    if (!validateForm()) {
      console.log('❌ Validación del formulario falló');
      console.log('🚨 Errores encontrados:', errors);
      return;
    }

    if (programado) {
      const t = new Date(programado).getTime();
      if (isNaN(t) || t < Date.now() + 30 * 60 * 1000) {
        alert('Programa tu pedido con al menos 30 minutos de anticipación');
        return;
      }
    }

    console.log('✅ Validación del formulario exitosa');
    setIsCheckingOut(true);
    
    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        delivery_address: customerInfo.address,
        delivery_instructions: customerInfo.notes || null,
        payment_method: paymentMethod,
        notes: customerInfo.notes || null,
        coupon_code: coupon?.code || null,
        redeem_points: puntosAplicados,
        scheduled_for: programado ? new Date(programado).toISOString() : null,
        items: cartItems.map(item => ({
          menu_item_id: item.menuItemId ?? parseInt(item.id),
          quantity: item.quantity,
          extra_ids: (item.extras || []).map(e => e.id)
        }))
      };

      const result = await apiService.createOrder(orderData);
      const order = result.data;
      console.log('✅ Pedido creado exitosamente');

      if (paymentMethod === 'mercadopago') {
        const preferencia = await apiService.createPaymentPreference(order.id);
        cartItems.forEach(item => removeFromCart(item.id));
        setCoupon(null);
        setCustomerInfo({ name: '', phone: '', email: '', address: '', notes: '' });
        window.location.href = preferencia.data.init_point;
        return;
      }

      // Crear mensaje de WhatsApp con el número de pedido
      const message = `🍔 *Nuevo Pedido - La Hamburguezona*

*Número de Pedido:* ${order.order_number}
*Cliente:* ${customerInfo.name}
*Teléfono:* ${customerInfo.phone}
*Dirección:* ${customerInfo.address}
${customerInfo.notes ? `*Notas:* ${customerInfo.notes}` : ''}

*Pedido:*
${cartItems.map(item => {
  const extrasTxt = (item.extras || []).map(e => `\n   + ${e.name}`).join('');
  return `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}${extrasTxt}`;
}).join('\n')}

*Resumen:*
Subtotal: $${order.subtotal.toFixed(2)}${order.discount > 0 ? `\nDescuento (${order.coupon_code}): -$${order.discount.toFixed(2)}` : ''}
IVA incluido: $${order.tax.toFixed(2)}
Envío: $${order.delivery_fee.toFixed(2)}
    *Total: $${order.total_amount.toFixed(2)}*

¡Gracias por elegir La Hamburguezona! 🍔`;

      window.open(whatsappLink(business, message), '_blank');

      // Limpiar el carrito después del pedido exitoso
      cartItems.forEach(item => removeFromCart(item.id));
      setCoupon(null);
      setPuntos(null);
      setPuntosCanje(0);
      setProgramado('');

      // Limpiar información del cliente
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });

      // Guardar datos del pedido y redirigir a página de confirmación
      const orderConfirmationData = {
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        customerEmail: customerInfo.email,
        orderTime: new Date().toLocaleString('es-MX'),
        items: cartItems.map(item => ({
          name: item.name + ((item.extras || []).length > 0 ? ` (${(item.extras || []).map(e => e.name).join(', ')})` : ''),
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        couponCode: order.coupon_code,
        deliveryFee: order.delivery_fee,
        tax: order.tax
      };

      localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmationData));
      window.location.href = '/confirmacion-pedido';
    } catch (error) {
      console.error('Error creating order:', error);
      alert(`Error al crear el pedido: ${error.message}. Por favor, inténtalo de nuevo.`);
    } finally {
      setIsCheckingOut(false);
    }
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
                        {(item.extras || []).length > 0 ? (
                          <p className="text-sm text-primary-600">
                            {(item.extras || []).map((e) => `+ ${e.name}`).join(' · ')}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">Deliciosa hamburguesa de La Hamburguezona</p>
                        )}
                        <p className="text-lg font-bold text-primary-500">${Number(item.price).toFixed(2)}</p>
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

                {/* Email Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Nombre Field */}
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
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
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
                        onChange={handlePhoneChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="5551234567"
                        maxLength={10}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                    {!errors.phone && customerInfo.phone && (
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          Dígitos: {customerInfo.phone.length}/10
                          {customerInfo.phone.length === 10 && validatePhone(customerInfo.phone) && (
                            <span className="text-green-600 ml-2">✓ Formato válido</span>
                          )}
                        </p>
                        {customerInfo.phone.length === 10 && validatePhone(customerInfo.phone) && (
                          <p className="text-xs text-gray-500">
                            Formato: {formatPhone(customerInfo.phone)}
                          </p>
                        )}
                      </div>
                    )}
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
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Calle, número, colonia, ciudad..."
                        rows={3}
                        required
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
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
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {(item.extras || []).length > 0 && (
                          <p className="text-xs text-primary-600">
                            {(item.extras || []).map((e) => `+ ${e.name}`).join(' · ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Cupón de descuento */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-green-700 font-medium">
                        Cupón <span className="font-bold">{coupon.code}</span> aplicado
                      </p>
                      <button onClick={quitarCupon} className="text-xs text-red-500 hover:underline">
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && aplicarCupon()}
                          placeholder="¿Tienes un cupón?"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                        />
                        <button
                          onClick={aplicarCupon}
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
                        >
                          {isValidatingCoupon ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
                    </>
                  )}
                </div>

                {/* Puntos de lealtad */}
                <div className="mt-3">
                  {puntos === null ? (
                    <button
                      onClick={consultarPuntos}
                      disabled={isConsultandoPuntos}
                      className="w-full px-3 py-2 text-sm font-medium text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 disabled:opacity-50 transition-colors"
                    >
                      {isConsultandoPuntos ? 'Consultando...' : '⭐ Consultar mis puntos de lealtad'}
                    </button>
                  ) : puntos.points === 0 ? (
                    <p className="text-xs text-gray-500 text-center">
                      Aún no tienes puntos. Deja tu email en el formulario y gana 1 punto por cada $10 de compra.
                    </p>
                  ) : (
                    <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-secondary-800">
                        ⭐ Tienes {puntos.points} puntos (valen ${(puntos.points * valorPunto).toFixed(2)})
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxPuntosCanjeables}
                          value={puntosCanje === 0 ? '' : puntosCanje}
                          onChange={(e) => setPuntosCanje(Math.max(0, Math.min(maxPuntosCanjeables, Number(e.target.value) || 0)))}
                          placeholder="0"
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-600">puntos a canjear (máx. {maxPuntosCanjeables})</span>
                        <button
                          onClick={() => setPuntosCanje(maxPuntosCanjeables)}
                          className="ml-auto text-xs text-primary-600 hover:underline"
                        >
                          Usar todos
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ¿Para cuándo? */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Para cuándo lo quieres?</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setProgramado('')}
                      className={`w-full px-3 py-2 text-sm text-left border rounded-lg transition-colors ${
                        !programado ? 'border-primary-500 bg-primary-50 font-medium' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      🚀 Lo antes posible
                    </button>
                    <div
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        programado ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                      }`}
                    >
                      <label className="block text-xs text-gray-500 mb-1">📅 Programar para:</label>
                      <input
                        type="datetime-local"
                        value={programado}
                        min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                        onChange={(e) => setProgramado(e.target.value)}
                        className="w-full text-sm bg-transparent focus:outline-none"
                      />
                      {programado && (
                        <p className="text-xs text-gray-500 mt-1">Mínimo 30 min de anticipación, máximo 7 días.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${subtotalWithTax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({coupon?.code})</span>
                      <span className="font-semibold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {puntosDescuento > 0 && (
                    <div className="flex justify-between text-secondary-600">
                      <span>Puntos canjeados ({puntosAplicados})</span>
                      <span className="font-semibold">-${puntosDescuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>IVA incluido (16%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary-500 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {baseFinal < 200 && (
                  <div className="mt-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <p className="text-sm text-secondary-700">
                      💡 ¡Agrega ${(200 - baseFinal).toFixed(2)} más para envío gratis!
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de pago
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('whatsapp')}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left transition-colors ${
                        paymentMethod === 'whatsapp'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">Efectivo o transferencia</p>
                        <p className="text-xs text-gray-500">Confirmas tu pedido por WhatsApp</p>
                      </div>
                      {paymentMethod === 'whatsapp' && (
                        <span className="w-4 h-4 rounded-full bg-primary-500 shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left transition-colors ${
                        paymentMethod === 'mercadopago'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">Pagar en línea con tarjeta</p>
                        <p className="text-xs text-gray-500">Serás redirigido a Mercado Pago</p>
                      </div>
                      {paymentMethod === 'mercadopago' && (
                        <span className="w-4 h-4 rounded-full bg-primary-500 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

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
                    ) : paymentMethod === 'mercadopago' ? (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Pagar Ahora
                      </>
                    ) : (
                      <>
                        <Phone className="w-5 h-5 mr-2" />
                        Enviar
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {paymentMethod === 'mercadopago'
                        ? 'Serás redirigido a Mercado Pago para completar tu pago'
                        : 'Al continuar, serás redirigido a WhatsApp para completar tu pedido'}
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
