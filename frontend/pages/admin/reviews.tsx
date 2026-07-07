import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import apiService from '../../services/api';
import type { Review } from '../../services/api';
import {
  Star,
  Check,
  X,
  Search,
  Filter,
  MessageSquare,
  User
} from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getReviews(statusFilter);
      setReviews(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.comment || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const updateReviewStatus = async (reviewId: Review['id'], newStatus: 'approved' | 'rejected') => {
    try {
      await apiService.moderateReview(reviewId, newStatus);
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Error al actualizar la reseña');
    }
  };

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Review['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
        <title>Gestión de Reseñas - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Reseñas</h1>
            <p className="text-gray-600 mt-2">Administra las reseñas de los clientes</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredReviews.length} reseñas
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, producto o comentario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.customer_name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">{review.rating}/5</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(review.status)}`}>
                      {getStatusText(review.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReviewStatus(review.id, 'approved')}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Aprobar reseña"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateReviewStatus(review.id, 'rejected')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Rechazar reseña"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron reseñas
            </h3>
            <p className="text-gray-600">
              No hay reseñas que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
