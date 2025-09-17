import React, { useState } from 'react';
import Head from 'next/head';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';

const ContactoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío del formulario
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Resetear formulario después de 3 segundos
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Dirección',
      content: 'Av. Principal 123, Centro Histórico, Ciudad de México',
      action: 'Ver en Google Maps'
    },
    {
      icon: Phone,
      title: 'Teléfono',
      content: '+52 55 5555 0123',
      action: 'Llamar ahora'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'contacto@lahamburguezona.com',
      action: 'Enviar email'
    },
    {
      icon: Clock,
      title: 'Horarios',
      content: 'Lun-Dom: 11:00 AM - 11:00 PM',
      action: 'Ver horarios'
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/lahamburguezona',
      icon: '📘'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/lahamburguezona',
      icon: '📷'
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/525555550123',
      icon: '💬'
    },
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@lahamburguezona',
      icon: '🎵'
    }
  ];

  return (
    <>
      <Head>
        <title>Contacto - La Hamburguezona</title>
        <meta name="description" content="Contáctanos en La Hamburguezona. Estamos aquí para atenderte y resolver todas tus dudas." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-warm py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            ¿Tienes alguna pregunta, sugerencia o quieres hacer una reservación? 
            ¡Estamos aquí para ayudarte!
          </p>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de Contacto */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h2>
              <p className="text-gray-600 mb-8">
                Estamos ubicados en el corazón de la ciudad, ofreciendo el mejor servicio 
                y las hamburguesas más deliciosas. ¡Te esperamos!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {info.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {info.content}
                      </p>
                      <button className="text-primary-500 hover:text-primary-600 font-medium text-sm">
                        {info.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Redes Sociales */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Síguenos en Redes Sociales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-2xl">{social.icon}</span>
                    <span className="font-medium text-gray-700">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* WhatsApp Directo */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    ¿Necesitas ayuda inmediata?
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Escríbenos por WhatsApp y te responderemos al instante
                  </p>
                  <a
                    href="https://wa.me/525555550123?text=Hola, me gustaría información sobre..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chatear por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Envíanos un Mensaje
            </h2>

            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Mensaje Enviado!
                </h3>
                <p className="text-gray-600">
                  Gracias por contactarnos. Te responderemos pronto.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+52 555-0123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="pedido">Consulta sobre pedido</option>
                    <option value="reservacion">Reservación</option>
                    <option value="queja">Queja o sugerencia</option>
                    <option value="trabajo">Oportunidad de trabajo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mapa (placeholder) */}
      <section className="bg-gray-100 py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Encuéntranos Aquí
          </h2>
          <div className="bg-gray-300 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Mapa interactivo de Google Maps
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Av. Principal 123, Centro Histórico, Ciudad de México
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactoPage;