import React from 'react';
import Head from 'next/head';
import { ShieldCheck } from 'lucide-react';
import { useBusinessInfo } from '../contexts/BusinessInfoContext';

const PoliticasPage = () => {
  const business = useBusinessInfo();

  return (
    <>
      <Head>
        <title>Aviso de Privacidad - {business.name}</title>
        <meta name="description" content={`Aviso de privacidad de ${business.name}: cómo tratamos tus datos personales.`} />
      </Head>

      <div className="bg-dark-900 text-white py-14">
        <div className="container-custom text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
          <h1 className="text-3xl md:text-4xl font-bold">Aviso de Privacidad</h1>
          <p className="text-gray-400 mt-2">Última actualización: julio de 2026</p>
        </div>
      </div>

      <div className="container-custom section-padding max-w-3xl">
        <div className="prose-legal space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Responsable del tratamiento de tus datos</h2>
            <p>
              {business.name}, con domicilio en {business.address}, es responsable del tratamiento de los datos
              personales que nos proporcionas, conforme a la Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares (LFPDPPP). Puedes contactarnos en{' '}
              <a href={`mailto:${business.email}`} className="text-primary-500 hover:underline">{business.email}</a>{' '}
              o al teléfono {business.phone}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Datos que recabamos</h2>
            <p>Para procesar tus pedidos recabamos únicamente los datos necesarios:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Nombre completo</li>
              <li>Número de teléfono</li>
              <li>Correo electrónico (opcional)</li>
              <li>Dirección de entrega e indicaciones para el repartidor</li>
            </ul>
            <p className="mt-2">
              No recabamos datos personales sensibles. Los pagos con tarjeta se procesan directamente por
              Mercado Pago; nosotros no almacenamos ningún dato bancario ni de tarjetas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalidades del tratamiento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Preparar, entregar y dar seguimiento a tus pedidos</li>
              <li>Contactarte por WhatsApp o teléfono sobre el estado de tu pedido</li>
              <li>Atender dudas, aclaraciones o quejas</li>
              <li>Mejorar nuestro menú y servicio (estadísticas internas)</li>
            </ul>
            <p className="mt-2">No compartimos ni vendemos tus datos a terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Derechos ARCO</h2>
            <p>
              Tienes derecho a Acceder, Rectificar y Cancelar tus datos personales, así como a Oponerte a su
              tratamiento. Para ejercer estos derechos, envíanos un correo a{' '}
              <a href={`mailto:${business.email}`} className="text-primary-500 hover:underline">{business.email}</a>{' '}
              indicando tu nombre y la solicitud; te responderemos en un plazo máximo de 20 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies y tecnologías similares</h2>
            <p>
              Este sitio usa almacenamiento local del navegador para recordar tu carrito de compra y, en su caso,
              herramientas de analítica para entender el uso del sitio de forma agregada. Puedes borrar estos
              datos en cualquier momento desde la configuración de tu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cambios a este aviso</h2>
            <p>
              Cualquier modificación a este aviso de privacidad se publicará en esta misma página. Te
              recomendamos revisarla periódicamente.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default PoliticasPage;
