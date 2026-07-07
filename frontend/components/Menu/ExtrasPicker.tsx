import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { MenuItem, MenuExtra } from '../../services/api';
import type { CartExtra } from '../../contexts/CartContext';

interface ExtrasPickerProps {
  item: MenuItem;
  extras: MenuExtra[];
  onConfirm: (extras: CartExtra[]) => void;
  onClose: () => void;
}

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/**
 * Selector de extras al agregar un producto al carrito (ej. Doble carne +$25).
 * Solo aparece cuando el producto tiene extras configurados.
 */
const ExtrasPicker: React.FC<ExtrasPickerProps> = ({ item, extras, onConfirm, onClose }) => {
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const elegidos = extras.filter((e) => seleccion.has(e.id));
  const precioFinal = Number(item.price) + elegidos.reduce((sum, e) => sum + Number(e.price), 0);

  const confirmar = () => {
    onConfirm(elegidos.map((e) => ({ id: e.id, name: e.name, price: Number(e.price) })));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
            <p className="text-sm text-gray-500">¿Le agregamos algo?</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-2">
          {extras.map((extra) => {
            const activo = seleccion.has(extra.id);
            return (
              <button
                key={extra.id}
                onClick={() => toggle(extra.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                  activo
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <span className={`font-medium ${activo ? 'text-primary-700' : 'text-gray-800'}`}>
                  {extra.name}
                </span>
                <span className={`text-sm font-semibold ${activo ? 'text-primary-600' : 'text-gray-500'}`}>
                  +{money(Number(extra.price))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0">
          <button onClick={confirmar} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            <span>Agregar al carrito · {money(precioFinal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtrasPicker;
