const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Menu endpoints
  async getMenuItems() {
    return this.request('/menu');
  }

  async getMenuItem(id: string) {
    return this.request(`/menu/${id}`);
  }

  async createMenuItem(item: any) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(id: string, item: any) {
    return this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItem(id: string) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async createOrder(order: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Reviews endpoints
  async getReviews() {
    return this.request('/reviews');
  }

  async getReview(id: string) {
    return this.request(`/reviews/${id}`);
  }

  async updateReviewStatus(id: string, status: string) {
    return this.request(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteReview(id: string) {
    return this.request(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers endpoints
  async getCustomers() {
    return this.request('/customers');
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  // Admin dashboard endpoints
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getReports(period: string = 'month') {
    return this.request(`/admin/reports?period=${period}`);
  }

  // Contact/Messages endpoints
  async getMessages() {
    return this.request('/contact/messages');
  }

  async getMessage(id: string) {
    return this.request(`/contact/messages/${id}`);
  }

  async updateMessageStatus(id: string, status: string) {
    return this.request(`/contact/messages/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteMessage(id: string) {
    return this.request(`/contact/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request('/admin/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Menu admin endpoints
  async getAllMenuItems() {
    return this.request('/menu/admin/all');
  }

  async updateMenuItemStatus(id: string, isActive: boolean) {
    return this.request(`/menu/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async updateMenuItem(id: string, item: any) {
    return this.request(`/menu/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

      async deleteMenuItem(id: string) {
        return this.request(`/menu/admin/${id}`, {
          method: 'DELETE',
        });
      }

      async createMenuItem(item: any) {
        return this.request('/menu/admin', {
          method: 'POST',
          body: JSON.stringify(item),
        });
      }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/upload/image`, {
      method: 'POST',
      body: formData,
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al subir la imagen');
    }

    return response.json();
  }

  // Hero Images methods
  async getHeroImages() {
    return this.request('/hero');
  }

  async getAllHeroImages() {
    return this.request('/hero/admin/all');
  }

  async createHeroImage(heroData: any) {
    return this.request('/hero/admin', {
      method: 'POST',
      body: JSON.stringify(heroData),
    });
  }

  async updateHeroImage(id: string, heroData: any) {
    return this.request(`/hero/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(heroData),
    });
  }

  async deleteHeroImage(id: string) {
    return this.request(`/hero/admin/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleHeroImageStatus(id: string) {
    return this.request(`/hero/admin/${id}/toggle`, {
      method: 'PUT',
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };
