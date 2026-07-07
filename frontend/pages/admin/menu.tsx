import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Clock,
  Flame,
  ChefHat
} from 'lucide-react';
import apiService, { MenuItem } from '../../services/api';
import ImageUpload from '../../components/UI/ImageUpload';
import RecetaModal from '../../components/Admin/RecetaModal';
import ExtrasEditorModal from '../../components/Admin/ExtrasEditorModal';
import { withAuth, useAuth } from '../../middleware/auth';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recetaItem, setRecetaItem] = useState<MenuItem | null>(null);
  const [extrasItem, setExtrasItem] = useState<MenuItem | null>(null);
  const auth = useAuth();
  const [editingProduct, setEditingProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    rating: '',
    prep_time: '',
    is_popular: false,
    is_spicy: false,
    is_active: true,
    ingredients: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    rating: '',
    prep_time: '',
    is_popular: false,
    is_spicy: false,
    is_active: true,
    ingredients: ''
  });

  const categories = [
    'Monstruo Clásico',
    'Zona Sabor', 
    'Combos Brutales',
    'Bebidas',
    'Extras'
  ];

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchTerm, categoryFilter]);

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMenuItems();
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error loading menu items:', error);
      alert('Error al cargar los items del menú');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = menuItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  };

  const toggleItemStatus = async (itemId: string) => {
    try {
      const item = menuItems.find(item => item.id === itemId);
      if (!item) return;

      const newStatus = !item.is_active;
      await apiService.updateMenuItem(itemId, { is_active: newStatus });

      setMenuItems(menuItems.map(item =>
        item.id === itemId ? { ...item, is_active: newStatus } : item
      ));
      alert(`Item ${newStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Error al actualizar el estado del item');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este item del menú?')) {
      try {
        await apiService.deleteMenuItem(itemId);
        setMenuItems(menuItems.filter(item => item.id !== itemId));
        alert('Item eliminado correctamente');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error al eliminar el item');
      }
    }
  };

  const createProduct = async () => {
    try {
      setIsCreating(true);
      
      // Validaciones básicas
      if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.category) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        image: newProduct.image || '/images/placeholder-burger.jpg',
        category: newProduct.category,
        rating: parseFloat(newProduct.rating) || 0,
        prep_time: parseInt(newProduct.prep_time) || 0,
        is_popular: newProduct.is_popular,
        is_spicy: newProduct.is_spicy,
        is_active: newProduct.is_active,
        ingredients: newProduct.ingredients ? newProduct.ingredients.split(',').map(ing => ing.trim()) : []
      };

      const response = await apiService.createMenuItem(productData);

      // Agregar el nuevo producto a la lista
      setMenuItems([...menuItems, response.data]);

      // Limpiar el formulario
      setNewProduct({
        name: '',
        description: '',
        price: '',
        image: '',
        category: '',
        rating: '',
        prep_time: '',
        is_popular: false,
        is_spicy: false,
        is_active: true,
        ingredients: ''
      });

      // Cerrar el modal
      setIsAddModalOpen(false);
      alert('Producto creado correctamente');
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.message || 'Error al crear el producto');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (item: MenuItem) => {
    console.log('Opening edit modal for item:', item);
    setSelectedItem(item);
    setEditingProduct({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      image: item.image,
      category: item.category,
      rating: item.rating.toString(),
      prep_time: item.prep_time.toString(),
      is_popular: item.is_popular || false,
      is_spicy: item.is_spicy || false,
      is_active: item.is_active,
      ingredients: (item.ingredients || []).join(', ')
    });
    setIsEditModalOpen(true);
  };

  const updateProduct = async () => {
    if (!selectedItem) return;

    try {
      setIsEditing(true);
      
      // Validaciones básicas
      if (!editingProduct.name || !editingProduct.description || !editingProduct.price || !editingProduct.category) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      const productData = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price),
        image: editingProduct.image || '/images/placeholder-burger.jpg',
        category: editingProduct.category,
        rating: parseFloat(editingProduct.rating) || 0,
        prep_time: parseInt(editingProduct.prep_time) || 0,
        is_popular: editingProduct.is_popular,
        is_spicy: editingProduct.is_spicy,
        is_active: editingProduct.is_active,
        ingredients: editingProduct.ingredients ? editingProduct.ingredients.split(',').map(ing => ing.trim()) : []
      };

      console.log('Updating product with data:', productData);

      await apiService.updateMenuItem(selectedItem.id, productData);

      // Actualizar el producto en la lista
      setMenuItems(menuItems.map(item =>
        item.id === selectedItem.id ? { ...item, ...productData } : item
      ));

      // Cerrar el modal
      setIsEditModalOpen(false);
      setSelectedItem(null);
      alert('Producto actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.message || 'Error al actualizar el producto');
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Gestión de Menú - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Menú</h1>
            <p className="text-gray-600 mt-2">Administra los productos del menú</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Producto</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {item.is_popular && (
                    <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      ⭐ Popular
                    </span>
                  )}
                  {item.is_spicy && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                      <Flame className="w-3 h-3" />
                      <span>Picante</span>
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{item.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{item.prep_time} min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary-500">${item.price}</div>
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleItemStatus(item.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        item.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {item.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4 inline mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 inline mr-1" />
                          Activar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setRecetaItem(item)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Receta e insumos (food cost)"
                    >
                      <ChefHat className="w-4 h-4" />
                    </button>
                    {auth.hasRole('ADMIN') && (
                      <button
                        onClick={() => setExtrasItem(item)}
                        className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                        title="Extras con precio (doble carne, tocino...)"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Agregar Nuevo Producto</h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del producto *</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ej: Monstruo Clásico"
                          required
                        />
                      </div>
                  
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <textarea
                          rows={3}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Describe el producto..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
                          <input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="180"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de preparación (min)</label>
                          <input
                            type="number"
                            value={newProduct.prep_time}
                            onChange={(e) => setNewProduct({...newProduct, prep_time: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="12"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                        <select 
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <ImageUpload
                          value={newProduct.image}
                          onChange={(url) => setNewProduct({...newProduct, image: url})}
                          disabled={isCreating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={newProduct.rating}
                          onChange={(e) => setNewProduct({...newProduct, rating: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="4.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
                        <input
                          type="text"
                          value={newProduct.ingredients}
                          onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Carne, Queso, Lechuga, Tomate"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={newProduct.is_spicy}
                            onChange={(e) => setNewProduct({...newProduct, is_spicy: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Es picante</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={newProduct.is_popular}
                            onChange={(e) => setNewProduct({...newProduct, is_popular: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Es popular</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={newProduct.is_active}
                            onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Está activo</span>
                        </label>
                      </div>
                </div>

                    <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button 
                        onClick={createProduct}
                        disabled={isCreating}
                        className="flex-1 btn-primary flex items-center justify-center space-x-2"
                      >
                        {isCreating ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Creando...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>Agregar Producto</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 btn-outline"
                        disabled={isCreating}
                      >
                        Cancelar
                      </button>
                    </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedItem(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del producto *</label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                  
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
                          <input
                            type="number"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de preparación (min)</label>
                          <input
                            type="number"
                            value={editingProduct.prep_time}
                            onChange={(e) => setEditingProduct({...editingProduct, prep_time: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                        <select 
                          value={editingProduct.category}
                          onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <ImageUpload
                          value={editingProduct.image}
                          onChange={(url) => setEditingProduct({...editingProduct, image: url})}
                          disabled={isEditing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={editingProduct.rating}
                          onChange={(e) => setEditingProduct({...editingProduct, rating: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
                        <input
                          type="text"
                          value={editingProduct.ingredients}
                          onChange={(e) => setEditingProduct({...editingProduct, ingredients: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={editingProduct.is_spicy}
                            onChange={(e) => setEditingProduct({...editingProduct, is_spicy: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Es picante</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={editingProduct.is_popular}
                            onChange={(e) => setEditingProduct({...editingProduct, is_popular: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Es popular</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={editingProduct.is_active}
                            onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})}
                            className="mr-2" 
                          />
                          <span className="text-sm text-gray-700">Está activo</span>
                        </label>
                      </div>
                </div>

                    <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button 
                        onClick={updateProduct}
                        disabled={isEditing}
                        className="flex-1 btn-primary flex items-center justify-center space-x-2"
                      >
                        {isEditing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Edit className="w-5 h-5" />
                            <span>Guardar Cambios</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setSelectedItem(null);
                        }}
                        className="flex-1 btn-outline"
                        disabled={isEditing}
                      >
                        Cancelar
                      </button>
                    </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal de extras con precio */}
        {extrasItem && (
          <ExtrasEditorModal
            menuItemId={Number(extrasItem.id)}
            menuItemName={extrasItem.name}
            onClose={() => setExtrasItem(null)}
          />
        )}

        {/* Modal de receta (insumos por producto) */}
        {recetaItem && (
          <RecetaModal
            menuItemId={Number(recetaItem.id)}
            menuItemName={recetaItem.name}
            menuItemPrice={Number(recetaItem.price)}
            canEdit={auth.hasRole('ADMIN')}
            onClose={() => setRecetaItem(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminMenu, ['ADMIN', 'COCINA']);

