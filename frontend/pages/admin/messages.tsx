import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Reply,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Check,
  Clock
} from 'lucide-react';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
  type: 'contact' | 'complaint' | 'suggestion' | 'other';
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, statusFilter, typeFilter]);

  const loadMessages = async () => {
    try {
      // TODO: Reemplazar con llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMessages: Message[] = [
        {
          id: '1',
          name: 'María González',
          email: 'maria@email.com',
          phone: '+52 555-0123',
          subject: 'Consulta sobre delivery',
          message: 'Hola, ¿hacen delivery a la zona de Polanco? ¿Cuál es el tiempo de entrega estimado?',
          status: 'unread',
          createdAt: '2025-09-16T19:30:00Z',
          type: 'contact'
        },
        {
          id: '2',
          name: 'Carlos Ruiz',
          email: 'carlos@email.com',
          phone: '+52 555-0456',
          subject: 'Queja sobre pedido',
          message: 'Mi pedido llegó tarde y la hamburguesa estaba fría. Necesitan mejorar el empaque térmico.',
          status: 'read',
          createdAt: '2025-09-16T18:45:00Z',
          type: 'complaint'
        },
        {
          id: '3',
          name: 'Ana Martínez',
          email: 'ana@email.com',
          phone: '+52 555-0789',
          subject: 'Sugerencia de menú',
          message: 'Me encantaría que agreguen una opción vegetariana al menú. ¿Tienen planes de incluir hamburguesas de soya?',
          status: 'replied',
          createdAt: '2025-09-16T17:20:00Z',
          type: 'suggestion'
        },
        {
          id: '4',
          name: 'Pedro López',
          email: 'pedro@email.com',
          phone: '+52 555-0321',
          subject: 'Felicitaciones',
          message: 'Excelente servicio y calidad. Las hamburguesas están deliciosas. ¡Sigan así!',
          status: 'read',
          createdAt: '2025-09-16T16:15:00Z',
          type: 'other'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(message => message.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(message => message.type === typeFilter);
    }

    setFilteredMessages(filtered);
  };

  const updateMessageStatus = async (messageId: string, newStatus: Message['status']) => {
    try {
      // TODO: Implementar actualización real
      setMessages(messages.map(message =>
        message.id === messageId ? { ...message, status: newStatus } : message
      ));
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      try {
        // TODO: Implementar eliminación real
        setMessages(messages.filter(message => message.id !== messageId));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'replied': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Message['status']) => {
    switch (status) {
      case 'unread': return 'No leído';
      case 'read': return 'Leído';
      case 'replied': return 'Respondido';
      default: return status;
    }
  };

  const getTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'complaint': return 'bg-red-100 text-red-800';
      case 'suggestion': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: Message['type']) => {
    switch (type) {
      case 'contact': return 'Contacto';
      case 'complaint': return 'Queja';
      case 'suggestion': return 'Sugerencia';
      case 'other': return 'Otro';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <title>Mensajes - Admin La Hamburguezona</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
            <p className="text-gray-600 mt-2">Gestiona los mensajes de los clientes</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredMessages.length} mensajes
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
                  placeholder="Buscar por nombre, asunto o mensaje..."
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
                <option value="all">Todos los estados</option>
                <option value="unread">No leídos</option>
                <option value="read">Leídos</option>
                <option value="replied">Respondidos</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                <option value="contact">Contacto</option>
                <option value="complaint">Queja</option>
                <option value="suggestion">Sugerencia</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div key={message.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{message.name}</h3>
                      <p className="text-sm text-gray-500">{message.subject}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-2">{message.message}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{message.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{message.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(message.createdAt)} {formatTime(message.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(message.type)}`}>
                        {getTypeText(message.type)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                        {getStatusText(message.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <button
                    onClick={() => setSelectedMessage(message)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver mensaje completo"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  {message.status !== 'replied' && (
                    <button
                      onClick={() => updateMessageStatus(message.id, 'replied')}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      title="Marcar como respondido"
                    >
                      <Reply className="w-5 h-5" />
                    </button>
                  )}
                  {message.status === 'unread' && (
                    <button
                      onClick={() => updateMessageStatus(message.id, 'read')}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Marcar como leído"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar mensaje"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron mensajes
            </h3>
            <p className="text-gray-600">
              No hay mensajes que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Sender Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Remitente</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedMessage.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedMessage.email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedMessage.phone}</p>
                    <p><span className="font-medium">Tipo:</span> {getTypeText(selectedMessage.type)}</p>
                    <p><span className="font-medium">Fecha:</span> {formatDate(selectedMessage.createdAt)} {formatTime(selectedMessage.createdAt)}</p>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mensaje</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-6 border-t border-gray-200">
                  <button className="flex-1 btn-primary">
                    Responder
                  </button>
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                    className="flex-1 btn-outline"
                  >
                    Marcar como Leído
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
