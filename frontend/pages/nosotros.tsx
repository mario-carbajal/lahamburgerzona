import React from 'react';
import Head from 'next/head';
import { Heart, Award, Users, Clock, Leaf, Star, Target, Zap } from 'lucide-react';

const NosotrosPage = () => {
  const values = [
    {
      icon: Heart,
      title: 'Pasión por la Cocina',
      description: 'Cada hamburguesa se prepara con amor y dedicación, usando técnicas tradicionales y ingredientes de la más alta calidad.'
    },
    {
      icon: Leaf,
      title: 'Ingredientes Frescos',
      description: 'Trabajamos con proveedores locales para garantizar que cada ingrediente sea fresco y de la mejor calidad.'
    },
    {
      icon: Users,
      title: 'Servicio al Cliente',
      description: 'Nuestro equipo está comprometido a brindar una experiencia excepcional a cada cliente que nos visita.'
    },
    {
      icon: Award,
      title: 'Excelencia Culinaria',
      description: 'Buscamos la perfección en cada detalle, desde la preparación hasta la presentación de nuestros platillos.'
    }
  ];

  const milestones = [
    {
      year: '2018',
      title: 'Nacimiento de La Hamburguezona',
      description: 'Abrimos nuestras puertas con la visión de crear las mejores hamburguesas de la ciudad.'
    },
    {
      year: '2019',
      title: 'Primera Expansión',
      description: 'Abrimos nuestro segundo local y comenzamos el servicio a domicilio.'
    },
    {
      year: '2020',
      title: 'Adaptación Digital',
      description: 'Implementamos pedidos online y delivery para enfrentar los desafíos de la pandemia.'
    },
    {
      year: '2021',
      title: 'Reconocimiento Local',
      description: 'Ganamos el premio "Mejor Hamburguesería Local" por segundo año consecutivo.'
    },
    {
      year: '2022',
      title: 'Menú Sostenible',
      description: 'Lanzamos nuestra línea de hamburguesas veganas y opciones sostenibles.'
    },
    {
      year: '2023',
      title: 'Innovación Culinaria',
      description: 'Presentamos nuestras hamburguesas gourmet y colaboraciones con chefs reconocidos.'
    }
  ];

  const team = [
    {
      name: 'Carlos Mendoza',
      position: 'Fundador y Chef Ejecutivo',
      image: '/images/team/carlos.jpg',
      description: 'Con más de 15 años de experiencia en gastronomía, Carlos fundó La Hamburguezona con la visión de crear hamburguesas únicas.'
    },
    {
      name: 'María Rodríguez',
      position: 'Gerente de Operaciones',
      image: '/images/team/maria.jpg',
      description: 'María se encarga de que cada detalle de la operación sea perfecto, desde la cocina hasta el servicio al cliente.'
    },
    {
      name: 'Diego Herrera',
      position: 'Chef de Cocina',
      image: '/images/team/diego.jpg',
      description: 'Diego es el maestro detrás de nuestras salsas secretas y técnicas de cocción que hacen únicas nuestras hamburguesas.'
    },
    {
      name: 'Ana López',
      position: 'Coordinadora de Calidad',
      image: '/images/team/ana.jpg',
      description: 'Ana asegura que cada ingrediente cumpla con nuestros estándares de calidad y frescura.'
    }
  ];

  const stats = [
    { icon: Users, number: '50,000+', label: 'Clientes Satisfechos' },
    { icon: Star, number: '4.8/5', label: 'Calificación Promedio' },
    { icon: Award, number: '15+', label: 'Premios Recibidos' },
    { icon: Clock, number: '5', label: 'Años de Experiencia' }
  ];

  return (
    <>
      <Head>
        <title>Nosotros - La Hamburguezona</title>
        <meta name="description" content="Conoce la historia, valores y equipo de La Hamburguezona. Descubre por qué somos la mejor opción para hamburguesas." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-warm py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Nuestra Historia
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Descubre la pasión, dedicación y amor que hay detrás de cada hamburguesa de La Hamburguezona.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Una Historia de Sabor y Pasión
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  La Hamburguezona nació en 2018 del sueño de crear las hamburguesas más deliciosas 
                  de la ciudad. Lo que comenzó como una pequeña cocina familiar se ha convertido en 
                  un referente gastronómico local.
                </p>
                <p>
                  Nuestro fundador, Carlos Mendoza, tenía una visión clara: crear hamburguesas que 
                  no solo fueran deliciosas, sino que también representaran la calidad y el amor 
                  por la buena comida que caracteriza a nuestra cultura.
                </p>
                <p>
                  Hoy, después de más de 5 años, seguimos comprometidos con esa visión original: 
                  ingredientes frescos, técnicas tradicionales y un servicio excepcional que hace 
                  que cada visita sea memorable.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-300 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Imagen de nuestra cocina original
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estos principios guían cada decisión que tomamos y cada hamburguesa que preparamos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestro Camino
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada año ha sido un paso más hacia la excelencia culinaria y el servicio excepcional.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary-500"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="text-primary-500 font-bold text-lg mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center relative z-10">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestro Equipo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conoce a las personas que hacen posible la magia de La Hamburguezona.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Users className="w-16 h-16 text-gray-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-primary-500 font-medium mb-3">
                  {member.position}
                </p>
                <p className="text-gray-600 text-sm">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compromiso */}
      <section className="section-padding bg-gradient-warm">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Nuestro Compromiso Contigo
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Prometemos seguir innovando, mejorando y superando tus expectativas en cada visita. 
            Tu satisfacción es nuestra mayor recompensa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/menu" className="btn-primary text-lg px-8 py-4">
              Ver Nuestro Menú
            </a>
            <a href="/contacto" className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900">
              Contáctanos
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default NosotrosPage;