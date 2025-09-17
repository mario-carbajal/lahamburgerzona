import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  Settings, 
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Bell,
  Shield,
  Globe
} from 'lucide-react';
import apiService from '../../services/api';

interface RestaurantSettings {
  general: {
    name: string;
    description: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  business: {
    openingHours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
    deliveryZone: string;
    deliveryFee: number;
    minimumOrder: number;
    averagePrepTime: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    newOrderAlerts: boolean;
    lowStockAlerts: boolean;
  };
  security: {
    adminPassword: string;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<RestaurantSettings>({
    general: {
      name: 'La Hamburguezona',
      description: '¡Sabor que conquista!',
      logo: '/logo.png',
      address: 'Calle Principal 123, Ciudad de México',
      phone: '+52 555-0123',
      email: 'contacto@lahamburguezona.com',
      website: 'https://lahamburguezona.com'
    },
    business: {
      openingHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '23:00', closed: false },
        saturday: { open: '10:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false }
      },
      deliveryZone: 'Ciudad de México y alrededores',
      deliveryFee: 30,
      minimumOrder: 200,
      averagePrepTime: 15
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newOrderAlerts: true,
      lowStockAlerts: true
    },
    security: {
      adminPassword: '',
      sessionTimeout: 60,
      twoFactorAuth: false,
      ipWhitelist: []
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'business', name: 'Negocio', icon: Clock },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'security', name: 'Seguridad', icon: Shield }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSettings();
      console.log('Settings response:', response);
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiService.updateSettings({ settings });
      console.log('Save response:', response);
      if (response.success) {
        alert('Configuración guardada correctamente');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: keyof RestaurantSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateOpeningHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        openingHours: {
          ...prev.business.openingHours,
          [day]: {
            ...prev.business.openingHours[day as keyof typeof prev.business.openingHours],
            [field]: value
          }
        }
      }
    }));
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Restaurante</label>
            <input
              type="text"
              value={settings.general.name}
              onChange={(e) => updateSetting('general', 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <input
              type="text"
              value={settings.general.description}
              onChange={(e) => updateSetting('general', 'description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <input
              type="tel"
              value={settings.general.phone}
              onChange={(e) => updateSetting('general', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.general.email}
              onChange={(e) => updateSetting('general', 'email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <textarea
              rows={3}
              value={settings.general.address}
              onChange={(e) => updateSetting('general', 'address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
            <input
              type="url"
              value={settings.general.website}
              onChange={(e) => updateSetting('general', 'website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day.key} className="flex items-center space-x-4">
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700">{day.label}</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!settings.business.openingHours[day.key as keyof typeof settings.business.openingHours].closed}
                  onChange={(e) => updateOpeningHours(day.key, 'closed', !e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Abierto</span>
              </div>
              {!settings.business.openingHours[day.key as keyof typeof settings.business.openingHours].closed && (
                <>
                  <input
                    type="time"
                    value={settings.business.openingHours[day.key as keyof typeof settings.business.openingHours].open}
                    onChange={(e) => updateOpeningHours(day.key, 'open', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">a</span>
                  <input
                    type="time"
                    value={settings.business.openingHours[day.key as keyof typeof settings.business.openingHours].close}
                    onChange={(e) => updateOpeningHours(day.key, 'close', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Delivery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona de Delivery</label>
            <input
              type="text"
              value={settings.business.deliveryZone}
              onChange={(e) => updateSetting('business', 'deliveryZone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo de Delivery</label>
            <input
              type="number"
              value={settings.business.deliveryFee}
              onChange={(e) => updateSetting('business', 'deliveryFee', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pedido Mínimo</label>
            <input
              type="number"
              value={settings.business.minimumOrder}
              onChange={(e) => updateSetting('business', 'minimumOrder', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Promedio de Preparación (min)</label>
            <input
              type="number"
              value={settings.business.averagePrepTime}
              onChange={(e) => updateSetting('business', 'averagePrepTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Notificaciones</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
              <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Notificaciones por SMS</h4>
              <p className="text-sm text-gray-500">Recibir alertas importantes por mensaje de texto</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.smsNotifications}
              onChange={(e) => updateSetting('notifications', 'smsNotifications', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Notificaciones Push</h4>
              <p className="text-sm text-gray-500">Recibir notificaciones en tiempo real en el navegador</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.pushNotifications}
              onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Alertas de Nuevos Pedidos</h4>
              <p className="text-sm text-gray-500">Recibir notificación inmediata cuando llegue un nuevo pedido</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.newOrderAlerts}
              onChange={(e) => updateSetting('notifications', 'newOrderAlerts', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Alertas de Stock Bajo</h4>
              <p className="text-sm text-gray-500">Recibir notificación cuando un producto tenga stock bajo</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.lowStockAlerts}
              onChange={(e) => updateSetting('notifications', 'lowStockAlerts', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Seguridad</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Contraseña de Administrador</label>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={settings.security.adminPassword}
              onChange={(e) => updateSetting('security', 'adminPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeout de Sesión (minutos)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Autenticación de Dos Factores</h4>
              <p className="text-sm text-gray-500">Agregar una capa adicional de seguridad</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
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
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
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
            {activeTab === 'business' && renderBusinessTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'security' && renderSecurityTab()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
