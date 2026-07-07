import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import apiService from '../services/api';

const PagoResultadoPage = () => {
  const router = useRouter();
  const { status, order_id } = router.query;
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!order_id) return;
    apiService
      .getOrder(order_id as string)
      .then((res) => setOrderNumber(res.data.order_number))
      .catch(() => {});
  }, [order_id]);

  const content = {
    success: {
      icon: <CheckCircle className="w-20 h-20 text-green-500" />,
      title: '¡Pago exitoso!',
      description: 'Tu pago fue confirmado. Estamos preparando tu pedido.',
      color: 'bg-green-50',
    },
    failure: {
      icon: <XCircle className="w-20 h-20 text-red-500" />,
      title: 'El pago no se pudo procesar',
      description: 'No te preocupes, tu pedido sigue registrado. Puedes intentar pagar de nuevo o contactarnos por WhatsApp.',
      color: 'bg-red-50',
    },
    pending: {
      icon: <Clock className="w-20 h-20 text-yellow-500" />,
      title: 'Pago en proceso',
      description: 'Tu pago está siendo revisado. Te avisaremos en cuanto se confirme.',
      color: 'bg-yellow-50',
    },
  };

  const current = content[status as string] || content.pending;

  return (
    <>
      <Head>
        <title>Resultado del Pago - La Hamburguezona</title>
      </Head>

      <div className={`min-h-screen flex items-center justify-center ${current.color} px-4`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">{current.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{current.title}</h1>
            <p className="text-gray-600">{current.description}</p>
          </div>

          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Número de pedido</p>
              <p className="text-lg font-semibold text-gray-900">#{orderNumber}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link href="/" className="btn-primary w-full block">
              Volver al inicio
            </Link>
            {status === 'failure' && (
              <Link href="/pedidos" className="btn-outline w-full block">
                Intentar de nuevo
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PagoResultadoPage;
