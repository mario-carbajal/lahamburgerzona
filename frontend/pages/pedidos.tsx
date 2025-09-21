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
    email: '',
    address: '',
    notes: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    exists: false,
    message: ''
  });
  const [userType, setUserType] = useState('new'); // 'new' o 'existing'
  const [verificationStatus, setVerificationStatus] = useState({
    checking: false,
    verified: false,
    message: ''
  });
  const [verifiedUserData, setVerifiedUserData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: ''
  });

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
  const deliveryFee = subtotalWithTax >= 200 ? 0 : 30;
  const subtotalWithoutTax = subtotalWithTax / 1.16; // Desglosar IVA del subtotal
  const tax = subtotalWithTax - subtotalWithoutTax; // IVA desglosado
  const total = subtotalWithTax + deliveryFee;

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

  const maskData = (data, showLast = 2) => {
    if (!data || data.length <= showLast) return data;
    const masked = '*'.repeat(data.length - showLast);
    return masked + data.slice(-showLast);
  };

  const maskPhone = (phone) => {
    if (!phone) return phone;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 3) {
      const maskedLength = cleanPhone.length - 3;
      const masked = '*'.repeat(maskedLength);
      return `${masked}${cleanPhone.slice(-3)}`;
    }
    return phone;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!validatePhone(customerInfo.phone)) {
      const cleanPhone = customerInfo.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos';
      } else if (cleanPhone.startsWith('0') || cleanPhone.startsWith('1')) {
        newErrors.phone = 'El teléfono no puede empezar con 0 o 1';
      } else {
        newErrors.phone = 'Ingresa un teléfono válido (ej: 5551234567)';
      }
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(customerInfo.email)) {
      newErrors.email = 'Ingresa un email válido (ej: usuario@email.com)';
    }

    // Validación adicional para usuarios existentes
    if (userType === 'existing' && emailStatus.exists && !verificationStatus.verified) {
      newErrors.name = 'Debes verificar tus datos antes de continuar';
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleEmailChange = async (e) => {
    const email = e.target.value;
    setCustomerInfo({...customerInfo, email: email});
    
    if (errors.email) {
      setErrors({...errors, email: ''});
    }

    // Verificar email si tiene formato válido
    if (email && validateEmail(email)) {
      setEmailStatus({ checking: true, exists: false, message: '' });
      
      try {
        const response = await fetch(`/api/customers/check-email/${encodeURIComponent(email)}`);
        const result = await response.json();
        
        if (result.success) {
          if (result.exists) {
            setEmailStatus({
              checking: false,
              exists: true,
              message: 'Este email ya está registrado. Selecciona "Soy cliente registrado" para continuar.'
            });
            setUserType('existing');
          } else {
            setEmailStatus({
              checking: false,
              exists: false,
              message: 'Email disponible para nuevos clientes.'
            });
            setUserType('new');
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailStatus({
          checking: false,
          exists: false,
          message: ''
        });
      }
    } else if (!email) {
      setEmailStatus({ checking: false, exists: false, message: '' });
      setUserType('new');
    }
  };

  const handleVerifyExistingUser = async () => {
    if (!customerInfo.email || !customerInfo.name) {
      setErrors({...errors, name: 'Email y nombre son requeridos para verificar'});
      return;
    }

    setVerificationStatus({ checking: true, verified: false, message: '' });
    
    try {
      const response = await fetch('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerInfo.email,
          name: customerInfo.name
        }),
      });

      const result = await response.json();
      
      if (result.success && result.verified) {
        setVerificationStatus({
          checking: false,
          verified: true,
          message: '¡Datos verificados correctamente!'
        });
        
        // Cargar datos del usuario verificado
        setVerifiedUserData({
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          address: result.data.address
        });
        
        // Auto-llenar el formulario con los datos verificados
        setCustomerInfo(prev => ({
          ...prev,
          name: result.data.name,
          phone: result.data.phone,
          address: result.data.address
        }));
        
        setErrors({...errors, name: '', email: ''});
      } else {
        setVerificationStatus({
          checking: false,
          verified: false,
          message: result.message || 'Error en la verificación'
        });
        setErrors({...errors, name: result.message || 'Error en la verificación'});
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      setVerificationStatus({
        checking: false,
        verified: false,
        message: 'Error al verificar los datos'
      });
      setErrors({...errors, name: 'Error al verificar los datos'});
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCheckingOut(true);
    
    try {
      // Crear el pedido en la base de datos
      const orderData = {
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
          email: customerInfo.email || null
        },
        items: cartItems.map(item => ({
          menuItemId: parseInt(item.id),
          quantity: item.quantity
        })),
        deliveryInstructions: customerInfo.notes || null,
        paymentMethod: 'whatsapp',
        notes: customerInfo.notes || null
      };

      // Enviar pedido al backend
      const response = await fetch('/api/orders-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Pedido creado exitosamente');
        
        // Calcular totales locales para el mensaje de WhatsApp
        const subtotalWithTax = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subtotalWithTax >= 200 ? 0 : 30;
        const subtotalWithoutTax = subtotalWithTax / 1.16; // Desglosar IVA del subtotal
        const tax = subtotalWithTax - subtotalWithoutTax; // IVA desglosado
        const total = subtotalWithTax + deliveryFee;
        
        // Crear mensaje de WhatsApp con el número de pedido
        const message = `🍔 *Nuevo Pedido - La Hamburguezona*

*Número de Pedido:* ${result.data.orderNumber}
*Cliente:* ${customerInfo.name}
*Teléfono:* ${customerInfo.phone}
*Dirección:* ${customerInfo.address}
${customerInfo.notes ? `*Notas:* ${customerInfo.notes}` : ''}

*Pedido:*
${cartItems.map(item => `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

*Resumen:*
Subtotal (sin IVA): $${subtotalWithoutTax.toFixed(2)}
IVA (16%): $${tax.toFixed(2)}
Envío: $${deliveryFee.toFixed(2)}
    *Total: $${total.toFixed(2)}*

¡Gracias por elegir La Hamburguezona! 🍔`;

        const whatsappUrl = `https://wa.me/525550123?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Limpiar el carrito después del pedido exitoso
        cartItems.forEach(item => removeFromCart(item.id));
        
        // Limpiar información del cliente
        setCustomerInfo({
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        });
        
        // Guardar datos del pedido y redirigir a página de confirmación
        console.log('🎫 Guardando datos del pedido...');
        const orderConfirmationData = {
          orderNumber: result.data.orderNumber,
          totalAmount: total, // Usar el total calculado localmente, no el del backend
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          customerEmail: customerInfo.email,
          orderTime: new Date().toLocaleString('es-MX'),
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })),
          subtotal: subtotalWithoutTax,
          deliveryFee: deliveryFee,
          tax: tax
        };
        
        // Guardar en localStorage para la página de confirmación
        localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmationData));
        
        console.log('🎫 Redirigiendo a página de confirmación...');
        // Redirigir a la página de confirmación
        window.location.href = '/confirmacion-pedido';
      } else {
        throw new Error(result.error || 'Error al crear el pedido');
      }
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

                {/* Email Field - Always visible */}
         <div className="mb-6">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Email *
           </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={handleEmailChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 
                        emailStatus.exists ? 'border-green-500 bg-green-50' : 
                        emailStatus.checking ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                      required
                    />
                    {/* Indicador de estado del email */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailStatus.checking && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {emailStatus.exists && !emailStatus.checking && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!emailStatus.exists && !emailStatus.checking && customerInfo.email && validateEmail(customerInfo.email) && (
                        <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  {emailStatus.message && !errors.email && (
                    <p className={`mt-1 text-sm ${emailStatus.exists ? 'text-green-600' : 'text-blue-600'}`}>
                      {emailStatus.message}
                    </p>
                  )}
                </div>

                {/* User Type Selection */}
                {customerInfo.email && emailStatus.exists && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-3">
                      Este email ya está registrado. ¿Cómo quieres continuar?
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setUserType('existing')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userType === 'existing' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        Soy cliente registrado
                      </button>
                      <button
                        onClick={() => setUserType('new')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userType === 'new' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                        }`}
                      >
                        Nuevo pedido
                      </button>
                    </div>
                  </div>
                )}

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
                          errors.name ? 'border-red-500' : 
                          verificationStatus.verified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                        }`}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                    {verificationStatus.verified && !errors.name && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">✓ Usuario verificado:</span> {verifiedUserData.name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Todos tus datos han sido cargados y verificados. Puedes proceder con tu pedido.
                        </p>
                      </div>
                    )}
                    {verificationStatus.message && !verificationStatus.verified && (
                      <p className="mt-1 text-sm text-red-600">{verificationStatus.message}</p>
                    )}
                  </div>

                  {/* Botón de verificación para usuarios existentes */}
                  {userType === 'existing' && emailStatus.exists && !verificationStatus.verified && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 mb-3">
                        Para continuar como cliente registrado, verifica tus datos:
                      </p>
                      <button
                        onClick={handleVerifyExistingUser}
                        disabled={verificationStatus.checking || !customerInfo.name}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verificationStatus.checking ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Verificando...</span>
                          </div>
                        ) : (
                          'Verificar Datos'
                        )}
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={verificationStatus.verified ? maskPhone(verifiedUserData.phone) : customerInfo.phone}
                        onChange={verificationStatus.verified ? undefined : handlePhoneChange}
                        readOnly={verificationStatus.verified}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 
                          verificationStatus.verified ? 'border-green-500 bg-green-100 cursor-not-allowed' : 'border-gray-300'
                        }`}
                        placeholder="5551234567"
                        maxLength={10}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                    {!errors.phone && customerInfo.phone && !verificationStatus.verified && (
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
                    {verificationStatus.verified && !errors.phone && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">✓ Teléfono verificado:</span> {maskPhone(verifiedUserData.phone)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Tu número de teléfono está verificado y protegido. No se puede modificar.
                        </p>
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
                          errors.address ? 'border-red-500' : 
                          verificationStatus.verified ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="Calle, número, colonia, ciudad..."
                        rows={3}
                        required
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                    {verificationStatus.verified && !errors.address && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">✓ Dirección registrada:</span> {maskData(verifiedUserData.address, 10)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Puedes modificar la dirección para este pedido si es necesario.
                        </p>
                      </div>
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
                    <span className="text-gray-600">Subtotal (sin IVA)</span>
                    <span className="font-semibold">${subtotalWithoutTax.toFixed(2)}</span>
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

                {subtotalWithTax < 200 && (
                  <div className="mt-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <p className="text-sm text-secondary-700">
                      💡 ¡Agrega $${(200 - subtotalWithTax).toFixed(2)} más para envío gratis!
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
                        Enviar
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
