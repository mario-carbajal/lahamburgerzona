import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
import apiService from '../../services/api';
import ImageUpload from '../../components/UI/ImageUpload';
import AdminLayout from '../../components/Admin/AdminLayout';

interface HeroImage {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const HeroManagementPage = () => {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newHeroImage, setNewHeroImage] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    ctaText: '¡Ordena Ahora!',
    ctaLink: '/pedidos',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadHeroImages();
  }, []);

  const loadHeroImages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllHeroImages();
      if (response.success) {
        setHeroImages(response.data);
      }
    } catch (error) {
      console.error('Error loading hero images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newHeroImage.title || !newHeroImage.imageUrl) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiService.createHeroImage(newHeroImage);
      if (response.success) {
        setShowAddModal(false);
        setNewHeroImage({
          title: '',
          subtitle: '',
          description: '',
          imageUrl: '',
          ctaText: '¡Ordena Ahora!',
          ctaLink: '/pedidos',
          isActive: true,
          sortOrder: 0
        });
        loadHeroImages();
        alert('Imagen hero creada correctamente');
      } else {
        alert('Error al crear la imagen hero');
      }
    } catch (error) {
      console.error('Error creating hero image:', error);
      alert('Error al crear la imagen hero');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editingImage || !editingImage.title || !editingImage.imageUrl) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsEditing(true);
      const response = await apiService.updateHeroImage(editingImage.id, editingImage);
      if (response.success) {
        setShowEditModal(false);
        setEditingImage(null);
        loadHeroImages();
        alert('Imagen hero actualizada correctamente');
      } else {
        alert('Error al actualizar la imagen hero');
      }
    } catch (error) {
      console.error('Error updating hero image:', error);
      alert('Error al actualizar la imagen hero');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen hero?')) {
      return;
    }

    try {
      const response = await apiService.deleteHeroImage(id);
      if (response.success) {
        loadHeroImages();
        alert('Imagen hero eliminada correctamente');
      } else {
        alert('Error al eliminar la imagen hero');
      }
    } catch (error) {
      console.error('Error deleting hero image:', error);
      alert('Error al eliminar la imagen hero');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const response = await apiService.toggleHeroImageStatus(id);
      if (response.success) {
        loadHeroImages();
      } else {
        alert('Error al cambiar el estado de la imagen hero');
      }
    } catch (error) {
      console.error('Error toggling hero image status:', error);
      alert('Error al cambiar el estado de la imagen hero');
    }
  };

  const openEditModal = (image: HeroImage) => {
    setEditingImage({ ...image });
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Head>
          <title>Gestión de Hero - La Hamburguezona Admin</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando imágenes hero...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Gestión de Hero - La Hamburguezona Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Imágenes Hero</h1>
            <p className="text-gray-600 mt-2">Administra las imágenes principales de la página de inicio</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Imagen Hero</span>
          </button>
        </div>

        {/* Hero Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heroImages.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={image.imageUrl.startsWith('/uploads/') ? `http://localhost:5000${image.imageUrl}` : image.imageUrl}
                  alt={image.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => toggleStatus(image.id)}
                    className={`p-2 rounded-full ${
                      image.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}
                    title={image.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {image.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{image.title}</h3>
                {image.subtitle && (
                  <p className="text-sm text-gray-600 mb-2">{image.subtitle}</p>
                )}
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{image.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    Orden: {image.sortOrder}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    image.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {image.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(image)}
                    className="flex-1 btn-outline text-sm py-2 flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroImages.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay imágenes hero</h3>
            <p className="text-gray-600 mb-6">Agrega la primera imagen hero para la página de inicio</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Agregar Primera Imagen Hero
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Agregar Imagen Hero</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={newHeroImage.title}
                  onChange={(e) => setNewHeroImage({...newHeroImage, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Título principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={newHeroImage.subtitle}
                  onChange={(e) => setNewHeroImage({...newHeroImage, subtitle: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Subtítulo (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={newHeroImage.description}
                  onChange={(e) => setNewHeroImage({...newHeroImage, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción del hero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen *</label>
                <ImageUpload
                  value={newHeroImage.imageUrl}
                  onChange={(url) => setNewHeroImage({...newHeroImage, imageUrl: url})}
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto del botón</label>
                  <input
                    type="text"
                    value={newHeroImage.ctaText}
                    onChange={(e) => setNewHeroImage({...newHeroImage, ctaText: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="¡Ordena Ahora!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enlace del botón</label>
                  <input
                    type="text"
                    value={newHeroImage.ctaLink}
                    onChange={(e) => setNewHeroImage({...newHeroImage, ctaLink: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="/pedidos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orden de visualización</label>
                  <input
                    type="number"
                    value={newHeroImage.sortOrder}
                    onChange={(e) => setNewHeroImage({...newHeroImage, sortOrder: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newHeroImage.isActive}
                    onChange={(e) => setNewHeroImage({...newHeroImage, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Imagen activa
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-outline"
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creando...' : 'Crear Imagen Hero'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Imagen Hero</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={editingImage.title}
                  onChange={(e) => setEditingImage({...editingImage, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Título principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={editingImage.subtitle || ''}
                  onChange={(e) => setEditingImage({...editingImage, subtitle: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Subtítulo (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={editingImage.description || ''}
                  onChange={(e) => setEditingImage({...editingImage, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción del hero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen *</label>
                <ImageUpload
                  value={editingImage.imageUrl}
                  onChange={(url) => setEditingImage({...editingImage, imageUrl: url})}
                  disabled={isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto del botón</label>
                  <input
                    type="text"
                    value={editingImage.ctaText}
                    onChange={(e) => setEditingImage({...editingImage, ctaText: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="¡Ordena Ahora!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enlace del botón</label>
                  <input
                    type="text"
                    value={editingImage.ctaLink}
                    onChange={(e) => setEditingImage({...editingImage, ctaLink: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="/pedidos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orden de visualización</label>
                  <input
                    type="number"
                    value={editingImage.sortOrder}
                    onChange={(e) => setEditingImage({...editingImage, sortOrder: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editingImage.isActive}
                    onChange={(e) => setEditingImage({...editingImage, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
                    Imagen activa
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-outline"
                disabled={isEditing}
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="btn-primary"
                disabled={isEditing}
              >
                {isEditing ? 'Actualizando...' : 'Actualizar Imagen Hero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default HeroManagementPage;
