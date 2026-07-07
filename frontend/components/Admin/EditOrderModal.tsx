import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X, Minus, PencilLine } from 'lucide-react';
import apiService from '../../services/api';
import type { Order, MenuItem, MenuExtra } from '../../services/api';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSaved: (order: Order) => void;
}

interface LineaEdit {
  menu_item_id: number;
  name: string;
  quantity: number;
  extras: { id: number; name: string; price: number }[];
  special_instructions?: string | null;
}

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/**
 * Edición de un pedido no finalizado: productos, cantidades, extras y datos de
 * entrega. El backend recalcula totales (a precio actual del menú), respeta el
 * cupón/puntos ya aplicados y reajusta el inventario si ya se había descontado.
 */
const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSaved }) => {
  const [lineas, setLineas] = useState<LineaEdit[]>(
    order.items.map((i) => ({
      menu_item_id: Number(i.menu_item_id),
      name: i.menu_item_name,
      quantity: i.quantity,
      // Los extras de pedidos previos a esta función no guardaron id: se omiten
      extras: (i.extras || []).filter((e) => e.id != null).map((e) => ({ id: e.id as number, name: e.name, price: e.price })),
      special_instructions: i.special_instructions,
    }))
  );
  const [phone, setPhone] = useState(order.customer_phone);
  const [address, setAddress] = useState(order.delivery_address);
  const [notes, setNotes] = useState(order.notes || '');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [nuevoProductoId, setNuevoProductoId] = useState('');
  const [extrasDisponibles, setExtrasDisponibles] = useState<MenuExtra[]>([]);
  const [extrasSeleccion, setExtrasSeleccion] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiService
      .getMenuItems()
      .then((res) => setMenuItems(res.data.filter((m: MenuItem) => m.is_active)))
      .catch((e) => console.error('Error loading menu:', e));
  }, []);

  // Al elegir producto para agregar, se cargan sus extras
  useEffect(() => {
    setExtrasDisponibles([]);
    setExtrasSeleccion(new Set());
    if (!nuevoProductoId) return;
    apiService
      .getExtras(nuevoProductoId)
      .then((res) => setExtrasDisponibles(res.data))
      .catch(() => setExtrasDisponibles([]));
  }, [nuevoProductoId]);

  const precioDe = useMemo(() => {
    const map = new Map<number, number>();
    menuItems.forEach((m) => map.set(Number(m.id), Number(m.price)));
    return map;
  }, [menuItems]);

  const previewTotal = lineas.reduce((sum, l) => {
    const base = precioDe.get(l.menu_item_id) ?? 0;
    const extras = l.extras.reduce((s, e) => s + e.price, 0);
    return sum + (base + extras) * l.quantity;
  }, 0);

  const agregarLinea = () => {
    if (!nuevoProductoId) return;
    const producto = menuItems.find((m) => String(m.id) === String(nuevoProductoId));
    if (!producto) return;
    const extras = extrasDisponibles
      .filter((e) => extrasSeleccion.has(e.id))
      .map((e) => ({ id: e.id, name: e.name, price: Number(e.price) }));
    setLineas((ls) => [
      ...ls,
      { menu_item_id: Number(producto.id), name: producto.name, quantity: 1, extras },
    ]);
    setNuevoProductoId('');
  };

  const cambiarCantidad = (idx: number, delta: number) => {
    setLineas((ls) =>
      ls
        .map((l, i) => (i === idx ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const handleSave = async () => {
    if (lineas.length === 0) {
      alert('El pedido necesita al menos un producto (si quieres eliminarlo, usa Cancelar Pedido)');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiService.editOrder(order.id, {
        items: lineas.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
          extra_ids: l.extras.map((e) => e.id),
          special_instructions: l.special_instructions || null,
        })),
        customer_phone: phone !== order.customer_phone ? phone : undefined,
        delivery_address: address !== order.delivery_address ? address : undefined,
        notes: notes !== (order.notes || '') ? notes : undefined,
      });
      onSaved(res.data);
    } catch (error: any) {
      alert(error.message || 'Error al editar el pedido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <PencilLine className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Editar Pedido {order.order_number}</h2>
              <p className="text-sm text-gray-500">
                Los precios se recalculan al precio actual del menú
                {order.coupon_code ? ` · cupón ${order.coupon_code} se conserva` : ''}
                {order.points_redeemed > 0 ? ` · ${order.points_redeemed} puntos canjeados se conservan` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Productos */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Productos</h3>
            {lineas.map((l, idx) => (
              <div key={idx} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{l.name}</p>
                  {l.extras.length > 0 && (
                    <p className="text-xs text-primary-600">
                      {l.extras.map((e) => `+ ${e.name}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarCantidad(idx, -1)}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{l.quantity}</span>
                  <button
                    onClick={() => cambiarCantidad(idx, 1)}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">
                  {money(((precioDe.get(l.menu_item_id) ?? 0) + l.extras.reduce((s, e) => s + e.price, 0)) * l.quantity)}
                </span>
                <button
                  onClick={() => setLineas((ls) => ls.filter((_, i) => i !== idx))}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Quitar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Agregar producto */}
            <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={nuevoProductoId}
                  onChange={(e) => setNuevoProductoId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Agregar producto...</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {money(Number(m.price))}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregarLinea}
                  disabled={!nuevoProductoId}
                  className="btn-primary text-sm px-4 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              {extrasDisponibles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extrasDisponibles.map((e) => (
                    <label key={e.id} className="flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded-full px-2.5 py-1 cursor-pointer hover:border-primary-300">
                      <input
                        type="checkbox"
                        checked={extrasSeleccion.has(e.id)}
                        onChange={(ev) =>
                          setExtrasSeleccion((prev) => {
                            const next = new Set(prev);
                            if (ev.target.checked) next.add(e.id);
                            else next.delete(e.id);
                            return next;
                          })
                        }
                        className="rounded"
                      />
                      {e.name} (+{money(Number(e.price))})
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Datos de entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-gray-100 shrink-0">
          <p className="text-sm text-gray-500">
            Subtotal estimado: <span className="font-bold text-gray-900">{money(previewTotal)}</span>
            <span className="text-xs"> (el total final lo calcula el sistema)</span>
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isSaving} className="btn-primary disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
