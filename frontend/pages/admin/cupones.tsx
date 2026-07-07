import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Plus, Edit, Ticket, X } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import type { Coupon } from '../../services/api';

const money = (n: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const EMPTY_FORM = {
  code: '',
  type: 'PERCENT' as 'PERCENT' | 'FIXED',
  value: '',
  min_subtotal: '',
  valid_from: '',
  valid_until: '',
  max_uses: '',
  is_active: true,
};

// datetime-local espera "YYYY-MM-DDTHH:mm" en hora local
const aInputLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CuponesPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getCoupons();
      if (res.ok) setCoupons(res.data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(Number(c.value)),
      min_subtotal: Number(c.min_subtotal) > 0 ? String(Number(c.min_subtotal)) : '',
      valid_from: aInputLocal(c.valid_from),
      valid_until: aInputLocal(c.valid_until),
      max_uses: c.max_uses ? String(c.max_uses) : '',
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || form.code.trim().length < 3) {
      alert('El código debe tener al menos 3 caracteres');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      alert('Captura el valor del descuento');
      return;
    }
    if (form.type === 'PERCENT' && Number(form.value) > 100) {
      alert('Un porcentaje no puede ser mayor a 100');
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        type: form.type,
        value: form.value,
        min_subtotal: form.min_subtotal || '0',
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        is_active: form.is_active,
      };
      if (editing) {
        await apiService.updateCoupon(editing.id, payload);
      } else {
        await apiService.createCoupon({ ...payload, code: form.code.trim().toUpperCase() });
      }
      setShowForm(false);
      load();
    } catch (error: any) {
      alert(error.message || 'Error al guardar el cupón');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActivo = async (c: Coupon) => {
    try {
      await apiService.updateCoupon(c.id, { is_active: !c.is_active } as any);
      load();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar el cupón');
    }
  };

  const vigencia = (c: Coupon) => {
    const f = (iso: string | null) =>
      iso ? new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : null;
    const desde = f(c.valid_from);
    const hasta = f(c.valid_until);
    if (!desde && !hasta) return 'Siempre';
    if (desde && hasta) return `${desde} — ${hasta}`;
    if (hasta) return `Hasta ${hasta}`;
    return `Desde ${desde}`;
  };

  const estado = (c: Coupon) => {
    if (!c.is_active) return { label: 'Inactivo', cls: 'bg-gray-100 text-gray-600' };
    if (c.valid_until && new Date(c.valid_until) < new Date()) return { label: 'Vencido', cls: 'bg-red-100 text-red-700' };
    if (c.max_uses && c.times_used >= c.max_uses) return { label: 'Agotado', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Vigente', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <AdminLayout>
      <Head>
        <title>Cupones - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cupones</h1>
            <p className="text-gray-600 mt-2">Códigos de descuento para el checkout del sitio</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nuevo Cupón</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando cupones...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Ticket className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              Aún no hay cupones. Crea el primero, por ejemplo: BIENVENIDO10 (10% de descuento).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Descuento</th>
                    <th className="px-4 py-3 font-medium">Compra mínima</th>
                    <th className="px-4 py-3 font-medium">Vigencia</th>
                    <th className="px-4 py-3 font-medium">Usos</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const est = estado(c);
                    return (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-gray-900">{c.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.type === 'PERCENT' ? `${Number(c.value)}%` : money(c.value)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {Number(c.min_subtotal) > 0 ? money(c.min_subtotal) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{vigencia(c)}</td>
                        <td className="px-4 py-3">
                          {c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${est.cls}`}>{est.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(c)}
                              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActivo(c)}
                              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {c.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <h2 className="text-lg font-semibold text-gray-900">{editing ? `Editar ${editing.code}` : 'Nuevo Cupón'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    className={`${inputCls} font-mono uppercase`}
                    placeholder="BIENVENIDO10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sin espacios; el cliente lo escribe en el checkout.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'PERCENT' | 'FIXED' }))}
                    className={inputCls}
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === 'PERCENT' ? 'Porcentaje *' : 'Monto ($) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    className={inputCls}
                    placeholder={form.type === 'PERCENT' ? '10' : '50'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compra mínima ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.min_subtotal}
                    onChange={(e) => setForm((f) => ({ ...f, min_subtotal: e.target.value }))}
                    className={inputCls}
                    placeholder="Sin mínimo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Límite de usos</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                    className={inputCls}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vigente desde</label>
                  <input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vigente hasta</label>
                  <input
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                Cupón activo
              </label>
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
    </AdminLayout>
  );
};

export default withAuth(CuponesPage, 'ADMIN');
