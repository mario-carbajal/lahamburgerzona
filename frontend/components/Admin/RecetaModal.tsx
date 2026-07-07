import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X, ChefHat } from 'lucide-react';
import apiService from '../../services/api';
import type { Supply } from '../../services/api';

interface RecetaModalProps {
  menuItemId: number;
  menuItemName: string;
  menuItemPrice: number;
  canEdit: boolean; // solo ADMIN edita; COCINA consulta
  onClose: () => void;
}

interface LineaForm {
  supply_id: number;
  quantity: string;
}

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/**
 * Editor de receta de un producto del menú: qué insumos consume y en qué cantidad.
 * Con la receta guardada, cada pedido que entra a cocina descuenta inventario solo,
 * y aquí se ve el food cost y el margen del producto.
 */
const RecetaModal: React.FC<RecetaModalProps> = ({ menuItemId, menuItemName, menuItemPrice, canEdit, onClose }) => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [recetaRes, suppliesRes] = await Promise.all([
          apiService.getReceta(menuItemId),
          apiService.getSupplies({ activo: true }),
        ]);
        if (suppliesRes.ok) setSupplies(suppliesRes.data);
        if (recetaRes.ok) {
          setLineas(
            recetaRes.data.lineas.map((l) => ({ supply_id: l.supply_id, quantity: String(parseFloat(l.quantity)) }))
          );
        }
      } catch (error) {
        console.error('Error loading receta:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [menuItemId]);

  const supplyById = useMemo(() => new Map(supplies.map((s) => [s.id, s])), [supplies]);

  const foodCost = lineas.reduce((sum, l) => {
    const s = supplyById.get(l.supply_id);
    return sum + (s ? (Number(l.quantity) || 0) * (Number(s.cost_per_unit) || 0) : 0);
  }, 0);
  const margen = menuItemPrice - foodCost;
  const margenPct = menuItemPrice > 0 ? (margen / menuItemPrice) * 100 : 0;

  const disponibles = supplies.filter((s) => !lineas.some((l) => l.supply_id === s.id));

  const addLinea = () => {
    if (disponibles.length === 0) return;
    setLineas((ls) => [...ls, { supply_id: disponibles[0].id, quantity: '' }]);
  };

  const handleSave = async () => {
    for (const l of lineas) {
      if (!l.quantity || Number(l.quantity) <= 0) {
        alert('Todas las líneas necesitan una cantidad mayor a 0');
        return;
      }
    }
    setIsSaving(true);
    try {
      await apiService.updateReceta(
        menuItemId,
        lineas.map((l) => ({ supply_id: l.supply_id, quantity: l.quantity }))
      );
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error al guardar la receta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Receta — {menuItemName}</h2>
              <p className="text-sm text-gray-500">Insumos que consume cada unidad vendida</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {supplies.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No hay insumos registrados. Crea primero los insumos en el módulo Insumos.
                </p>
              ) : lineas.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  Este producto aún no tiene receta — sus ventas no descuentan inventario.
                </p>
              ) : (
                <div className="space-y-2">
                  {lineas.map((l, idx) => {
                    const s = supplyById.get(l.supply_id);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={l.supply_id}
                          disabled={!canEdit}
                          onChange={(e) =>
                            setLineas((ls) => ls.map((x, i) => (i === idx ? { ...x, supply_id: Number(e.target.value) } : x)))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          {supplies
                            .filter((sup) => sup.id === l.supply_id || !lineas.some((x) => x.supply_id === sup.id))
                            .map((sup) => (
                              <option key={sup.id} value={sup.id}>{sup.name}</option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={l.quantity}
                          disabled={!canEdit}
                          onChange={(e) =>
                            setLineas((ls) => ls.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500 w-14">{s?.unit || ''}</span>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {s ? money((Number(l.quantity) || 0) * Number(s.cost_per_unit)) : ''}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => setLineas((ls) => ls.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Quitar insumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {canEdit && disponibles.length > 0 && (
                <button
                  onClick={addLinea}
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Agregar insumo
                </button>
              )}

              {/* Food cost y margen */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Costo de insumos</p>
                  <p className="text-lg font-bold text-gray-900">{money(foodCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Precio de venta</p>
                  <p className="text-lg font-bold text-gray-900">{money(menuItemPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Margen</p>
                  <p className={`text-lg font-bold ${margen < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {money(margen)} <span className="text-xs font-medium">({margenPct.toFixed(0)}%)</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            {canEdit ? 'Cancelar' : 'Cerrar'}
          </button>
          {canEdit && (
            <button onClick={handleSave} disabled={isSaving || isLoading} className="btn-primary disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecetaModal;
