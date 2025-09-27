const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Interfaces para las respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  prep_time: number;
  is_spicy: boolean;
  is_popular: boolean;
  ingredients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_instructions?: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  status: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  notes?: string;
  status_notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  customer_name: string;
  customer_email?: string;
  menu_item_id: number;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'COCINA' | 'REPARTIDOR' | 'CAJA';
  full_name: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgRating: number;
  ordersByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topMenuItems: Array<{ name: string; orders: number }>;
  recentOrders: Order[];
  reviews: {
    total: number;
    avg_rating: number;
    pending: number;
    approved: number;
  };
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: AdminUser;
  };
  message?: string;
}

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
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
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
  async getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    return this.request<ApiResponse<MenuItem[]>>('/menu');
  }

  async getMenuItem(id: string): Promise<ApiResponse<MenuItem>> {
    return this.request<ApiResponse<MenuItem>>(`/menu/${id}`);
  }

  async createMenuItem(item: any): Promise<ApiResponse<MenuItem>> {
    return this.request<ApiResponse<MenuItem>>('/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(id: string, item: any): Promise<ApiResponse<MenuItem>> {
    return this.request<ApiResponse<MenuItem>>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItem(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/menu/${id}`, {
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
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<ApiResponse<DashboardStats>>('/admin/dashboard');
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
  async getSettings(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/admin/settings');
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Menu admin endpoints
  async getAllMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    return this.request<ApiResponse<MenuItem[]>>('/menu/admin/all');
  }

  async updateMenuItemStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/menu/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async updateMenuItemAdmin(id: string, item: any): Promise<ApiResponse<MenuItem>> {
    return this.request<ApiResponse<MenuItem>>(`/menu/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItemAdmin(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/menu/admin/${id}`, {
      method: 'DELETE',
    });
  }

  async createMenuItemAdmin(item: any): Promise<ApiResponse<MenuItem>> {
    return this.request<ApiResponse<MenuItem>>('/menu/admin', {
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
  async getHeroImages(): Promise<ApiResponse<HeroImage[]>> {
    return this.request<ApiResponse<HeroImage[]>>('/hero');
  }

  async getAllHeroImages(): Promise<ApiResponse<HeroImage[]>> {
    return this.request<ApiResponse<HeroImage[]>>('/hero/admin/all');
  }

  async createHeroImage(heroData: any): Promise<ApiResponse<HeroImage>> {
    return this.request<ApiResponse<HeroImage>>('/hero/admin', {
      method: 'POST',
      body: JSON.stringify(heroData),
    });
  }

  async updateHeroImage(id: string, heroData: any): Promise<ApiResponse<HeroImage>> {
    return this.request<ApiResponse<HeroImage>>(`/hero/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(heroData),
    });
  }

  async deleteHeroImage(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/hero/admin/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleHeroImageStatus(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/hero/admin/${id}/toggle`, {
      method: 'PUT',
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };

// Export interfaces for use in other components
export type { 
  ApiResponse, 
  HeroImage, 
  MenuItem, 
  Order, 
  Review, 
  Customer, 
  AdminUser, 
  DashboardStats, 
  LoginResponse 
};
