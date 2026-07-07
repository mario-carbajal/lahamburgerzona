import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { withAuth } from '../../middleware/auth';
import {
  Settings,
  Save,
  Clock,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Upload,
  Trash2
} from 'lucide-react';
import apiService from '../../services/api';

// Solo campos respaldados por la tabla `settings` del backend (clave-valor).
interface RestaurantSettings {
  restaurant_name: string;
  restaurant_phone: string;
  restaurant_email: string;
  restaurant_address: string;
  restaurant_city: string;
  opening_hours: string;
  whatsapp_number: string;
  facebook_url: string;
  logo_url: string;
  slogan: string;
  delivery_fee: number;
  free_delivery_threshold: number;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurant_name: 'La Hamburguezona',
  restaurant_phone: '',
  restaurant_email: '',
  restaurant_address: '',
  restaurant_city: '',
  opening_hours: '',
  whatsapp_number: '',
  facebook_url: '',
  logo_url: '',
  slogan: '',
  delivery_fee: 30,
  free_delivery_threshold: 200,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Subida de logo (se guarda al instante, sin depender del botón "Guardar Cambios")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Cambio de contraseña (endpoint real: PUT /auth/cambiar-password)
  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'delivery', name: 'Envíos', icon: Clock },
    { id: 'security', name: 'Seguridad', icon: Shield },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSettings();
      const rows = response.data as { setting_key: string; setting_value: string }[];

      setSettings(prev => {
        const next = { ...prev };
        for (const row of rows) {
          switch (row.setting_key) {
            case 'restaurant_name':
              next.restaurant_name = row.setting_value;
              break;
            case 'restaurant_phone':
              next.restaurant_phone = row.setting_value;
              break;
            case 'restaurant_email':
              next.restaurant_email = row.setting_value;
              break;
            case 'restaurant_address':
              next.restaurant_address = row.setting_value;
              break;
            case 'restaurant_city':
              next.restaurant_city = row.setting_value;
              break;
            case 'opening_hours':
              next.opening_hours = row.setting_value;
              break;
            case 'whatsapp_number':
              next.whatsapp_number = row.setting_value;
              break;
            case 'facebook_url':
              next.facebook_url = row.setting_value;
              break;
            case 'logo_url':
              next.logo_url = row.setting_value;
              break;
            case 'slogan':
              next.slogan = row.setting_value;
              break;
            case 'delivery_fee':
              next.delivery_fee = Number(row.setting_value);
              break;
            case 'free_delivery_threshold':
              next.free_delivery_threshold = Number(row.setting_value);
              break;
          }
        }
        return next;
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        apiService.updateSetting('restaurant_name', settings.restaurant_name),
        apiService.updateSetting('restaurant_phone', settings.restaurant_phone),
        apiService.updateSetting('restaurant_email', settings.restaurant_email),
        apiService.updateSetting('restaurant_address', settings.restaurant_address),
        apiService.updateSetting('restaurant_city', settings.restaurant_city),
        apiService.updateSetting('opening_hours', settings.opening_hours),
        apiService.updateSetting('whatsapp_number', settings.whatsapp_number),
        apiService.updateSetting('facebook_url', settings.facebook_url),
        apiService.updateSetting('logo_url', settings.logo_url),
        apiService.updateSetting('slogan', settings.slogan),
        apiService.updateSetting('delivery_fee', String(settings.delivery_fee)),
        apiService.updateSetting('free_delivery_threshold', String(settings.free_delivery_threshold)),
      ]);
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.actual || !passwordForm.nueva) {
      alert('Completa todos los campos');
      return;
    }
    if (passwordForm.nueva.length < 8) {
      alert('La contraseña nueva debe tener al menos 8 caracteres');
      return;
    }
    if (passwordForm.nueva !== passwordForm.confirmar) {
      alert('La contraseña nueva y su confirmación no coinciden');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiService.cambiarPassword(passwordForm.actual, passwordForm.nueva);
      setPasswordForm({ actual: '', nueva: '', confirmar: '' });
      alert('Contraseña actualizada correctamente. Úsala en tu próximo inicio de sesión.');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const updateField = (field: keyof RestaurantSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await apiService.uploadImage(file);
      const url = res.data.url;
      await apiService.updateSetting('logo_url', url);
      updateField('logo_url', url);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(error.message || 'Error al subir el logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('¿Quitar el logo y volver al logo por defecto (🍔)?')) return;
    try {
      await apiService.updateSetting('logo_url', '');
      updateField('logo_url', '');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      alert(error.message || 'Error al quitar el logo');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo del Sitio</h3>
        <div className="flex items-center gap-6">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo actual"
              className="w-20 h-20 rounded-full object-cover border border-gray-200 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-3xl">🍔</span>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingLogo ? 'Subiendo...' : settings.logo_url ? 'Cambiar Logo' : 'Subir Logo'}</span>
              </button>
              {settings.logo_url && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Quitar</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG o WEBP, máximo 5MB. Se muestra redondo en el encabezado y pie del sitio —
              lo ideal es una imagen cuadrada. Se guarda al instante al subirlo.
            </p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Restaurante</label>
            <input
              type="text"
              value={settings.restaurant_name}
              onChange={(e) => updateField('restaurant_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eslogan</label>
            <input
              type="text"
              value={settings.slogan}
              onChange={(e) => updateField('slogan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="¡Sabor que conquista!"
            />
            <p className="text-xs text-gray-500 mt-1">Se muestra bajo el nombre en el encabezado y pie del sitio.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <input
              type="tel"
              value={settings.restaurant_phone}
              onChange={(e) => updateField('restaurant_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.restaurant_email}
              onChange={(e) => updateField('restaurant_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <textarea
              rows={3}
              value={settings.restaurant_address}
              onChange={(e) => updateField('restaurant_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
            <input
              type="text"
              value={settings.restaurant_city}
              onChange={(e) => updateField('restaurant_city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Xalapa, Veracruz"
            />
            <p className="text-xs text-gray-500 mt-1">Se muestra en el encabezado y pie del sitio.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horario</label>
            <input
              type="text"
              value={settings.opening_hours}
              onChange={(e) => updateField('opening_hours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Mar - Sáb · 16:00 - 22:00"
            />
            <p className="text-xs text-gray-500 mt-1">Texto libre, tal como quieres que se vea en el sitio.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp para Pedidos</label>
            <input
              type="tel"
              value={settings.whatsapp_number}
              onChange={(e) => updateField('whatsapp_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="2281440319"
            />
            <p className="text-xs text-gray-500 mt-1">10 dígitos sin lada de país. Aquí llegan los pedidos de los clientes.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook (URL)</label>
            <input
              type="url"
              value={settings.facebook_url}
              onChange={(e) => updateField('facebook_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://www.facebook.com/..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeliveryTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Envíos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo de Envío ($)</label>
            <input
              type="number"
              min={0}
              value={settings.delivery_fee}
              onChange={(e) => updateField('delivery_fee', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Se cobra en cada pedido a domicilio.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Envío Gratis a Partir de ($)</label>
            <input
              type="number"
              min={0}
              value={settings.free_delivery_threshold}
              onChange={(e) => updateField('free_delivery_threshold', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Pedidos con subtotal mayor a este monto no pagan envío.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Mi Contraseña</h3>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.actual}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, actual: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Nueva</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.nueva}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, nueva: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña Nueva</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmar}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmar: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Repite la contraseña nueva"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <KeyRound className="w-5 h-5" />
            <span>{isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <Head>
        <title>Configuración - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600 mt-2">Administra la configuración del sistema</p>
          </div>
          {activeTab !== 'security' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'delivery' && renderDeliveryTab()}
            {activeTab === 'security' && renderSecurityTab()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminSettings, 'ADMIN');
