import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import apiService from '../../services/api';
import type { AuditLogEntry } from '../../services/api';
import { History, Filter, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  crear: 'Creó',
  actualizar: 'Actualizó',
  desactivar: 'Desactivó',
  eliminar: 'Eliminó',
  cancelar: 'Canceló',
  cambiar_estado: 'Cambió estado de',
  moderar: 'Moderó',
  reset_password: 'Reseteó contraseña de',
};

const MODULE_LABELS: Record<string, string> = {
  pedidos: 'Pedidos',
  menu: 'Menú',
  reseñas: 'Reseñas',
  clientes: 'Clientes',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
  hero: 'Hero',
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    apiService.getAuditLogModules().then(r => setModules(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, moduleFilter]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAuditLog({
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setLogs(response.data);
      setTotal(response.total ?? response.data.length);
    } catch (error) {
      console.error('Error loading audit log:', error);
      setLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <AdminLayout>
      <Head>
        <title>Log de Auditoría - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <History className="w-8 h-8 text-primary-500" />
              Log de Auditoría
            </h1>
            <p className="text-gray-600 mt-2">Historial de acciones realizadas por el equipo administrativo</p>
          </div>
          <button
            onClick={() => loadLogs()}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los módulos</option>
            {modules.map((m) => (
              <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay registros de auditoría todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Módulo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.admin_user_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {ACTION_LABELS[log.action] || log.action}
                        {log.entity_id && <span className="text-gray-400"> #{log.entity_id}</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
                          {MODULE_LABELS[log.module] || log.module}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 px-2">Página {page} de {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminAuditLog, 'ADMIN');
