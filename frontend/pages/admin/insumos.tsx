import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plus,
  Edit,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import ImageUpload from '../../components/UI/ImageUpload';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import type { Supply, SupplyMovement, SupplyMovementType } from '../../services/api';

const UNIDADES = ['pieza', 'kg', 'g', 'l', 'ml', 'paquete', 'caja', 'bolsa'];

const TIPO_LABELS: Record<SupplyMovementType, string> = {
  ENTRADA: 'Entrada (compra)',
  SALIDA: 'Salida (consumo)',
  MERMA: 'Merma (desperdicio)',
  AJUSTE: 'Ajuste (conteo físico)',
};

const TIPO_BADGE: Record<SupplyMovementType, string> = {
  ENTRADA: 'bg-green-100 text-green-800',
  SALIDA: 'bg-blue-100 text-blue-800',
  MERMA: 'bg-red-100 text-red-800',
  AJUSTE: 'bg-yellow-100 text-yellow-800',
};

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const num = (s: string | number) => Number(s) || 0;

// Cantidades sin ceros de sobra: 2.500 → 2.5, 3.000 → 3
const cantidad = (s: string | number) => String(parseFloat(String(num(s).toFixed(3))));

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const EMPTY_FORM = {
  name: '', unit: 'pieza', image: '', min_stock: '', cost_per_unit: '',
  supplier_name: '', supplier_phone: '', initial_stock: '',
};
const EMPTY_MOV = { type: 'ENTRADA' as SupplyMovementType, quantity: '', unit_cost: '', note: '' };

const InsumosPage = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modal crear/editar
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  // Modal movimiento
  const [movSupply, setMovSupply] = useState<Supply | null>(null);
  const [mov, setMov] = useState({ ...EMPTY_MOV });
  const [isMoving, setIsMoving] = useState(false);

  // Modal conteo físico
  const [showConteo, setShowConteo] = useState(false);
  const [conteo, setConteo] = useState<Record<number, string>>({});
  const [isCounting, setIsCounting] = useState(false);

  // Modal historial
  const [histSupply, setHistSupply] = useState<Supply | null>(null);
  const [movimientos, setMovimientos] = useState<SupplyMovement[]>([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [isLoadingHist, setIsLoadingHist] = useState(false);

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getSupplies();
      if (res.ok) setSupplies(res.data);
    } catch (error) {
      console.error('Error loading supplies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const esBajoStock = (s: Supply) => num(s.current_stock) <= num(s.min_stock);

  const visibles = supplies.filter((s) => {
    if (soloBajoStock && !esBajoStock(s)) return false;
    if (busqueda && !s.name.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const activos = supplies.filter((s) => s.is_active);
  const valorTotal = activos.reduce((sum, s) => sum + num(s.current_stock) * num(s.cost_per_unit), 0);
  const alertas = activos.filter(esBajoStock).length;

  // ── Crear / editar ──────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (s: Supply) => {
    setEditing(s);
    setForm({
      name: s.name,
      unit: s.unit,
      image: s.image || '',
      min_stock: cantidad(s.min_stock),
      cost_per_unit: s.cost_per_unit,
      supplier_name: s.supplier_name || '',
      supplier_phone: s.supplier_phone || '',
      initial_stock: '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('El nombre del insumo es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await apiService.updateSupply(editing.id, {
          name: form.name.trim(),
          unit: form.unit,
          image: form.image || null,
          min_stock: form.min_stock || '0',
          cost_per_unit: form.cost_per_unit || '0',
          supplier_name: form.supplier_name.trim() || null,
          supplier_phone: form.supplier_phone.trim() || null,
        });
      } else {
        await apiService.createSupply({
          name: form.name.trim(),
          unit: form.unit,
          image: form.image || null,
          min_stock: form.min_stock || '0',
          cost_per_unit: form.cost_per_unit || '0',
          supplier_name: form.supplier_name.trim() || null,
          supplier_phone: form.supplier_phone.trim() || null,
          initial_stock: form.initial_stock || '0',
        });
      }
      setShowForm(false);
      loadSupplies();
    } catch (error: any) {
      alert(error.message || 'Error al guardar el insumo');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActivo = async (s: Supply) => {
    const accion = s.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Seguro que quieres ${accion} "${s.name}"?`)) return;
    try {
      await apiService.updateSupply(s.id, { is_active: !s.is_active });
      loadSupplies();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar el insumo');
    }
  };

  // ── Movimientos ─────────────────────────────────────────

  const openMovimiento = (s: Supply, tipo: SupplyMovementType = 'ENTRADA') => {
    setMovSupply(s);
    setMov({ ...EMPTY_MOV, type: tipo });
  };

  const handleMovimiento = async () => {
    if (!movSupply) return;
    if (mov.quantity === '' || Number(mov.quantity) < 0) {
      alert('Ingresa una cantidad válida');
      return;
    }
    setIsMoving(true);
    try {
      await apiService.createSupplyMovement(movSupply.id, {
        type: mov.type,
        quantity: mov.quantity,
        unit_cost: mov.type === 'ENTRADA' && mov.unit_cost ? mov.unit_cost : undefined,
        note: mov.note || undefined,
      });
      setMovSupply(null);
      loadSupplies();
    } catch (error: any) {
      alert(error.message || 'Error al registrar el movimiento');
    } finally {
      setIsMoving(false);
    }
  };

  // ── Conteo físico ───────────────────────────────────────

  const openConteo = () => {
    setConteo({});
    setShowConteo(true);
  };

  const handleConteo = async () => {
    const lineas = Object.entries(conteo)
      .filter(([, v]) => v !== '')
      .map(([id, v]) => ({ supply_id: Number(id), counted: v }));
    if (lineas.length === 0) {
      alert('Captura al menos un conteo');
      return;
    }
    setIsCounting(true);
    try {
      const res = await apiService.createConteo(lineas);
      const { ajustados, sin_cambio } = res.data;
      setShowConteo(false);
      loadSupplies();
      alert(
        ajustados.length === 0
          ? `Conteo registrado: todo cuadró (${sin_cambio} sin diferencia).`
          : `Conteo registrado: ${ajustados.length} ajustado(s), ${sin_cambio} sin diferencia.\n\n` +
            ajustados.map((a) => `• ${a.name}: ${cantidad(a.antes)} → ${cantidad(a.despues)}`).join('\n')
      );
    } catch (error: any) {
      alert(error.message || 'Error al registrar el conteo');
    } finally {
      setIsCounting(false);
    }
  };

  // ── Historial ───────────────────────────────────────────

  const openHistorial = async (s: Supply, page = 1) => {
    setHistSupply(s);
    setHistPage(page);
    setIsLoadingHist(true);
    try {
      const res = await apiService.getSupplyMovements(s.id, page, 20);
      if (res.ok) {
        setMovimientos(res.data);
        setHistTotal(res.total);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setIsLoadingHist(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Insumos - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insumos</h1>
            <p className="text-gray-600 mt-2">Inventario interno de cocina: existencias, costos y mermas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openConteo}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              title="Conteo físico de todos los insumos"
            >
              <ClipboardCheck className="w-5 h-5" />
              <span>Conteo Físico</span>
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nuevo Insumo</span>
            </button>
          </div>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Insumos activos</p>
              <p className="text-2xl font-bold text-gray-900">{activos.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor del inventario</p>
              <p className="text-2xl font-bold text-gray-900">{money(valorTotal)}</p>
            </div>
          </div>
          <button
            onClick={() => setSoloBajoStock((v) => !v)}
            className={`bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4 text-left transition-colors ${
              soloBajoStock ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 hover:border-red-200'
            }`}
            title="Click para filtrar solo insumos en alerta"
          >
            <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bajo stock mínimo</p>
              <p className={`text-2xl font-bold ${alertas > 0 ? 'text-red-600' : 'text-gray-900'}`}>{alertas}</p>
            </div>
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar insumo..."
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando insumos...</p>
            </div>
          ) : visibles.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {supplies.length === 0
                ? 'Aún no hay insumos. Crea el primero con "Nuevo Insumo".'
                : 'Ningún insumo coincide con el filtro.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">Insumo</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Mínimo</th>
                    <th className="px-4 py-3 font-medium">Costo unit.</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((s) => (
                    <tr key={s.id} className={`border-b border-gray-50 ${!s.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.image ? (
                            <img
                              src={getImageUrl(s.image)}
                              alt={s.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Boxes className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{s.name}</span>
                            {s.supplier_name && (
                              <p className="text-xs text-gray-400">
                                Prov: {s.supplier_name}{s.supplier_phone ? ` · ${s.supplier_phone}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={esBajoStock(s) && s.is_active ? 'text-red-600 font-semibold' : ''}>
                          {cantidad(s.current_stock)} {s.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {cantidad(s.min_stock)} {s.unit}
                      </td>
                      <td className="px-4 py-3">{money(num(s.cost_per_unit))}</td>
                      <td className="px-4 py-3">{money(num(s.current_stock) * num(s.cost_per_unit))}</td>
                      <td className="px-4 py-3">
                        {!s.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inactivo</span>
                        ) : esBajoStock(s) ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">⚠ Bajo mínimo</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openMovimiento(s, 'ENTRADA')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Registrar entrada"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openMovimiento(s, 'SALIDA')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Registrar salida / merma / ajuste"
                          >
                            <ArrowUpFromLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openHistorial(s)}
                            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Historial de movimientos"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActivo(s)}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            title={s.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {s.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Carne de res para hamburguesa"
                />
              </div>
              <ImageUpload
                value={form.image}
                onChange={(url) => setForm((f) => ({ ...f, image: url }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className={inputCls}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.min_stock}
                    onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))}
                    className={inputCls}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Al llegar aquí se marca en alerta.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo por unidad ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.cost_per_unit}
                    onChange={(e) => setForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
                    className={inputCls}
                    placeholder="0.00"
                  />
                  {editing && (
                    <p className="text-xs text-gray-500 mt-1">Se recalcula solo con cada entrada con costo.</p>
                  )}
                </div>
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={form.initial_stock}
                      onChange={(e) => setForm((f) => ({ ...f, initial_stock: e.target.value }))}
                      className={inputCls}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lo que hay hoy; queda registrado como entrada.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={form.supplier_name}
                    onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))}
                    className={inputCls}
                    placeholder="A quién se lo compras"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del proveedor</label>
                  <input
                    type="tel"
                    value={form.supplier_phone}
                    onChange={(e) => setForm((f) => ({ ...f, supplier_phone: e.target.value }))}
                    className={inputCls}
                    placeholder="Para pedirle rápido"
                  />
                  {editing?.ultima_compra && (
                    <p className="text-xs text-gray-500 mt-1">
                      Última compra: {new Date(editing.ultima_compra).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary disabled:opacity-50">
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {movSupply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Movimiento de Inventario</h2>
                <p className="text-sm text-gray-500">
                  {movSupply.name} — stock actual: {cantidad(movSupply.current_stock)} {movSupply.unit}
                </p>
              </div>
              <button onClick={() => setMovSupply(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                <select
                  value={mov.type}
                  onChange={(e) => setMov((m) => ({ ...m, type: e.target.value as SupplyMovementType }))}
                  className={inputCls}
                >
                  {(Object.keys(TIPO_LABELS) as SupplyMovementType[]).map((t) => (
                    <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {mov.type === 'AJUSTE' ? `Stock contado (${movSupply.unit})` : `Cantidad (${movSupply.unit})`}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={mov.quantity}
                  onChange={(e) => setMov((m) => ({ ...m, quantity: e.target.value }))}
                  className={inputCls}
                  placeholder="0"
                />
                {mov.type === 'AJUSTE' && (
                  <p className="text-xs text-gray-500 mt-1">El stock quedará exactamente en este valor.</p>
                )}
              </div>
              {mov.type === 'ENTRADA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo por unidad de esta compra ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={mov.unit_cost}
                    onChange={(e) => setMov((m) => ({ ...m, unit_cost: e.target.value }))}
                    className={inputCls}
                    placeholder="Opcional"
                  />
                  <p className="text-xs text-gray-500 mt-1">Si lo capturas, el costo promedio del insumo se actualiza solo.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                <input
                  type="text"
                  value={mov.note}
                  onChange={(e) => setMov((m) => ({ ...m, note: e.target.value }))}
                  className={inputCls}
                  placeholder={mov.type === 'MERMA' ? 'Ej. se echó a perder por caducidad' : 'Opcional'}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setMovSupply(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleMovimiento} disabled={isMoving} className="btn-primary disabled:opacity-50">
                {isMoving ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conteo físico */}
      {showConteo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conteo Físico</h2>
                <p className="text-sm text-gray-500">
                  Cuenta lo que hay realmente y captúralo. Solo se ajustan los que difieran;
                  los que dejes vacíos no se tocan.
                </p>
              </div>
              <button onClick={() => setShowConteo(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {activos.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No hay insumos activos que contar.</p>
              ) : (
                activos.map((s) => {
                  const valor = conteo[s.id] ?? '';
                  const difiere = valor !== '' && Number(valor) !== num(s.current_stock);
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">
                          Sistema: {cantidad(s.current_stock)} {s.unit}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={valor}
                        onChange={(e) => setConteo((c) => ({ ...c, [s.id]: e.target.value }))}
                        className={`w-28 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${
                          difiere ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                        }`}
                        placeholder="Contado"
                      />
                      <span className="text-xs text-gray-500 w-12">{s.unit}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowConteo(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleConteo} disabled={isCounting} className="btn-primary disabled:opacity-50">
                {isCounting ? 'Registrando...' : 'Registrar Conteo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial */}
      {histSupply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Historial — {histSupply.name}</h2>
                <p className="text-sm text-gray-500">
                  Stock actual: {cantidad(histSupply.current_stock)} {histSupply.unit}
                </p>
              </div>
              <button onClick={() => setHistSupply(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {isLoadingHist ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : movimientos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sin movimientos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {movimientos.map((m) => (
                    <div key={m.id} className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${TIPO_BADGE[m.type]}`}>
                            {m.type}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {m.type === 'AJUSTE'
                              ? `Conteo: ${cantidad(m.quantity)} ${histSupply.unit}`
                              : `${cantidad(m.quantity)} ${histSupply.unit}`}
                          </span>
                          {m.unit_cost && (
                            <span className="text-xs text-gray-500">a {money(num(m.unit_cost))} c/u</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Stock: {cantidad(m.stock_before)} → {cantidad(m.stock_after)}
                          {m.usuario ? ` · por ${m.usuario}` : ''}
                        </p>
                        {m.note && <p className="text-xs text-gray-600 mt-1 italic">{m.note}</p>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                        {new Date(m.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {histTotal > 20 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <button
                  onClick={() => openHistorial(histSupply, histPage - 1)}
                  disabled={histPage <= 1 || isLoadingHist}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {histPage} de {Math.ceil(histTotal / 20)}
                </span>
                <button
                  onClick={() => openHistorial(histSupply, histPage + 1)}
                  disabled={histPage >= Math.ceil(histTotal / 20) || isLoadingHist}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default withAuth(InsumosPage, ['ADMIN', 'COCINA']);
