import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, PlusCircle } from 'lucide-react';
import apiService from '../../services/api';

interface ExtrasEditorModalProps {
  menuItemId: number;
  menuItemName: string;
  onClose: () => void;
}

interface ExtraForm {
  name: string;
  price: string;
  is_active: boolean;
}

/**
 * Editor de extras con precio de un producto (ej. "Doble carne" +$25).
 * Los pedidos ya realizados no se afectan: guardan su propio snapshot.
 */
const ExtrasEditorModal: React.FC<ExtrasEditorModalProps> = ({ menuItemId, menuItemName, onClose }) => {
  const [extras, setExtras] = useState<ExtraForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiService
      .getExtras(menuItemId)
      .then((res) => {
        if (res.ok) {
          setExtras(res.data.map((e) => ({ name: e.name, price: String(e.price), is_active: e.is_active })));
        }
      })
      .catch((error) => console.error('Error loading extras:', error))
      .finally(() => setIsLoading(false));
  }, [menuItemId]);

  const handleSave = async () => {
    for (const e of extras) {
      if (!e.name.trim()) {
        alert('Todos los extras necesitan nombre');
        return;
      }
      if (e.price === '' || Number(e.price) < 0) {
        alert(`Precio inválido en "${e.name}"`);
        return;
      }
    }
    setIsSaving(true);
    try {
      await apiService.updateExtras(
        menuItemId,
        extras.map((e) => ({ name: e.name.trim(), price: Number(e.price), is_active: e.is_active }))
      );
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error al guardar los extras');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Extras — {menuItemName}</h2>
              <p className="text-sm text-gray-500">Opciones con costo que el cliente puede agregar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              {extras.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Sin extras. Agrega el primero, por ejemplo: &quot;Doble carne&quot; a $25.
                </p>
              )}
              {extras.map((e, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={e.name}
                    onChange={(ev) => setExtras((xs) => xs.map((x, i) => (i === idx ? { ...x, name: ev.target.value } : x)))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    placeholder="Doble carne"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={e.price}
                      onChange={(ev) => setExtras((xs) => xs.map((x, i) => (i === idx ? { ...x, price: ev.target.value } : x)))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="25"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={e.is_active}
                      onChange={(ev) => setExtras((xs) => xs.map((x, i) => (i === idx ? { ...x, is_active: ev.target.checked } : x)))}
                      className="rounded"
                    />
                    Activo
                  </label>
                  <button
                    onClick={() => setExtras((xs) => xs.filter((_, i) => i !== idx))}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Eliminar extra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setExtras((xs) => [...xs, { name: '', price: '', is_active: true }])}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Agregar extra
              </button>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving || isLoading} className="btn-primary disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Extras'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtrasEditorModal;
