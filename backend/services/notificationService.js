const axios = require('axios');

class NotificationService {
  constructor() {
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.restaurantPhone = process.env.RESTAURANT_PHONE || '+1234567890';
    this.restaurantName = process.env.RESTAURANT_NAME || 'La Hamburguezona';
  }

  // Formatear número de teléfono para WhatsApp
  formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Si no tiene código de país, agregar +52 (México)
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    
    return cleanPhone;
  }

  // Generar mensaje de nueva orden para el restaurante
  generateNewOrderMessage(order) {
    const { orderNumber, customer, totalAmount, estimatedDeliveryTime } = order;
    
    const message = `🍔 *NUEVA ORDEN - ${this.restaurantName}*

📋 *Orden:* #${orderNumber}
👤 *Cliente:* ${customer.name}
📞 *Teléfono:* ${customer.phone}
📍 *Dirección:* ${customer.address}
💰 *Total:* $${totalAmount.toFixed(2)}
⏰ *Tiempo estimado:* ${new Date(estimatedDeliveryTime).toLocaleTimeString('es-MX')}

¡Nueva orden recibida! 🎉`;

    return message;
  }

  // Generar mensaje de cambio de estado para el cliente
  generateStatusUpdateMessage(order) {
    const { orderNumber, status, notes } = order;
    
    const statusMessages = {
      'confirmed': '✅ *Tu orden ha sido confirmada*',
      'preparing': '👨‍🍳 *Tu orden está siendo preparada*',
      'ready': '🚀 *¡Tu orden está lista para entrega!*',
      'delivered': '🎉 *¡Tu orden ha sido entregada!*',
      'cancelled': '❌ *Tu orden ha sido cancelada*'
    };

    let message = `${statusMessages[status] || '📋 *Actualización de tu orden*'}

📋 *Orden:* #${orderNumber}
📞 *Estado:* ${this.getStatusText(status)}`;

    if (notes) {
      message += `\n💬 *Nota:* ${notes}`;
    }

    message += `\n\nGracias por elegir ${this.restaurantName}! 🍔`;

    return message;
  }

  // Generar mensaje de cancelación
  generateCancellationMessage(order) {
    const { orderNumber, reason } = order;
    
    return `❌ *Orden Cancelada*

📋 *Orden:* #${orderNumber}
📝 *Razón:* ${reason || 'Cancelado por el restaurante'}

Si tienes alguna pregunta, no dudes en contactarnos.
${this.restaurantName} 🍔`;
  }

  // Obtener texto del estado
  getStatusText(status) {
    const statusTexts = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'preparing': 'En preparación',
      'ready': 'Lista',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada'
    };
    return statusTexts[status] || status;
  }

  // Enviar mensaje por WhatsApp (simulación)
  async sendWhatsAppMessage(phone, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const whatsappUrl = `${this.whatsappApiUrl}?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      
      console.log(`📱 WhatsApp URL generada: ${whatsappUrl}`);
      
      // En producción, usar la API de WhatsApp Business
      // const response = await axios.post(whatsappUrl, { message });
      
      return {
        success: true,
        url: whatsappUrl,
        message: 'Mensaje preparado para WhatsApp'
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificación de nueva orden al restaurante
  async notifyNewOrder(order) {
    try {
      const message = this.generateNewOrderMessage(order);
      
      // En producción, enviar al número del restaurante
      const result = await this.sendWhatsAppMessage(this.restaurantPhone, message);
      
      console.log(`📱 Notificación de nueva orden enviada: ${order.orderNumber}`);
      return result;
    } catch (error) {
      console.error('Error notifying new order:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación de cambio de estado al cliente
  async notifyStatusChange(order) {
    try {
      const message = this.generateStatusUpdateMessage(order);
      
      const result = await this.sendWhatsAppMessage(order.customerPhone, message);
      
      console.log(`📱 Notificación de estado enviada al cliente: ${order.orderNumber}`);
      return result;
    } catch (error) {
      console.error('Error notifying status change:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación de cancelación al cliente
  async notifyCancellation(order) {
    try {
      const message = this.generateCancellationMessage(order);
      
      const result = await this.sendWhatsAppMessage(order.customerPhone, message);
      
      console.log(`📱 Notificación de cancelación enviada: ${order.orderNumber}`);
      return result;
    } catch (error) {
      console.error('Error notifying cancellation:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar mensaje personalizado
  async sendCustomMessage(phone, message) {
    try {
      const result = await this.sendWhatsAppMessage(phone, message);
      return result;
    } catch (error) {
      console.error('Error sending custom message:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar reporte de ventas diario
  generateDailySalesReport(orders, totalRevenue, period) {
    const message = `📊 *Reporte de Ventas - ${period}*

💰 *Ingresos Totales:* $${totalRevenue.toFixed(2)}
📋 *Total de Órdenes:* ${orders.length}
📈 *Promedio por Orden:* $${(totalRevenue / orders.length).toFixed(2)}

📋 *Órdenes del Día:*
${orders.map(order => 
  `• #${order.orderNumber} - $${order.totalAmount.toFixed(2)} - ${this.getStatusText(order.status)}`
).join('\n')}

¡Excelente trabajo equipo! 🎉`;

    return message;
  }

  // Enviar reporte diario al administrador
  async sendDailyReport(orders, totalRevenue, period = 'Hoy') {
    try {
      const message = this.generateDailySalesReport(orders, totalRevenue, period);
      
      // En producción, enviar al administrador
      const result = await this.sendWhatsAppMessage(this.restaurantPhone, message);
      
      console.log(`📊 Reporte diario enviado: ${period}`);
      return result;
    } catch (error) {
      console.error('Error sending daily report:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
