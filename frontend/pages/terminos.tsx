import React from 'react';
import Head from 'next/head';
import { ScrollText } from 'lucide-react';
import { useBusinessInfo } from '../contexts/BusinessInfoContext';

const TerminosPage = () => {
  const business = useBusinessInfo();

  return (
    <>
      <Head>
        <title>Términos y Condiciones - {business.name}</title>
        <meta name="description" content={`Términos y condiciones del servicio de pedidos en línea de ${business.name}.`} />
      </Head>

      <div className="bg-dark-900 text-white py-14">
        <div className="container-custom text-center">
          <ScrollText className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
          <h1 className="text-3xl md:text-4xl font-bold">Términos y Condiciones</h1>
          <p className="text-gray-400 mt-2">Última actualización: julio de 2026</p>
        </div>
      </div>

      <div className="container-custom section-padding max-w-3xl">
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceptación</h2>
            <p>
              Al realizar un pedido a través de este sitio aceptas estos términos y condiciones. El servicio es
              operado por {business.name}, con domicilio en {business.address}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Pedidos y horario</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Los pedidos se atienden dentro de nuestro horario de servicio: {business.openingHours}.</li>
              <li>Los pedidos realizados fuera de horario se atenderán al reanudar el servicio.</li>
              <li>Al confirmar tu pedido recibirás un número de orden para darle seguimiento.</li>
              <li>Los tiempos de entrega son estimados y pueden variar por demanda, clima o tráfico.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Precios y pagos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Todos los precios están expresados en pesos mexicanos (MXN) e incluyen los impuestos aplicables mostrados en el resumen del pedido.</li>
              <li>Aceptamos pago en efectivo contra entrega y pago en línea a través de Mercado Pago.</li>
              <li>El costo de envío se muestra antes de confirmar el pedido; los pedidos que superen el monto mínimo publicado tienen envío gratis.</li>
              <li>Los precios y promociones pueden cambiar sin previo aviso; se respeta el precio vigente al momento de confirmar tu pedido.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Zona de entrega</h2>
            <p>
              Entregamos en {business.city} y zonas cercanas. Si tu dirección queda fuera de nuestra zona de
              cobertura, te lo haremos saber al momento de coordinar la entrega y el pedido podrá cancelarse
              sin costo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cancelaciones y reembolsos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Puedes cancelar tu pedido sin costo mientras no haya entrado a preparación, contactándonos al {business.phone}.</li>
              <li>Una vez en preparación, el pedido ya no puede cancelarse.</li>
              <li>Si recibiste un producto incorrecto o en mal estado, contáctanos dentro de los 30 minutos siguientes a la entrega y lo repondremos o reembolsaremos.</li>
              <li>Los reembolsos de pagos en línea se procesan por el mismo medio de pago en los plazos que establezca Mercado Pago.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Alérgenos</h2>
            <p>
              Nuestros productos pueden contener o estar en contacto con gluten, lácteos, huevo, soya, ajonjolí
              y frutos secos. Si tienes alguna alergia, indícalo en las instrucciones especiales de tu pedido y
              con gusto te orientamos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Reseñas y contenido</h2>
            <p>
              Las reseñas publicadas por clientes pasan por moderación. Nos reservamos el derecho de no publicar
              contenido ofensivo, falso o ajeno a la experiencia de compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contacto</h2>
            <p>
              Para cualquier duda sobre estos términos, escríbenos a{' '}
              <a href={`mailto:${business.email}`} className="text-primary-500 hover:underline">{business.email}</a>{' '}
              o llámanos al {business.phone}.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default TerminosPage;
