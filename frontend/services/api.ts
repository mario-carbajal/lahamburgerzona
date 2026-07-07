import { clearSession, getCurrentToken } from '../utils/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  total?: number;
  page?: number;
  page_size?: number;
}

export interface HeroImage {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  rating: number;
  prep_time: number;
  is_spicy: boolean;
  is_popular: boolean;
  ingredients?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  extras?: { id?: number; name: string; price: number }[] | null;
}

export interface MenuExtra {
  id: number;
  menu_item_id: number;
  name: string;
  price: number;
  is_active: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  min_subtotal: string;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: string;
  notes?: string;
  changed_by?: string;
  changed_at: string;
}

export interface Order {
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
  discount: number;
  coupon_code?: string | null;
  points_redeemed: number;
  points_discount: number;
  points_awarded: number;
  scheduled_for?: string | null;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  status: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistoryEntry[];
}

export interface Review {
  id: string;
  customer_name: string;
  customer_email?: string;
  menu_item_id?: string;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  loyalty_points?: number;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'COCINA' | 'REPARTIDOR' | 'CAJA';
  full_name: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  admin_user_id: number;
  admin_user_name: string;
  action: string;
  module: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface Supply {
  id: number;
  name: string;
  unit: string;
  image: string | null;
  current_stock: string; // Numeric llega como string desde el API
  min_stock: string;
  cost_per_unit: string;
  supplier_name: string | null;
  supplier_phone: string | null;
  ultima_compra?: string | null; // fecha de la última ENTRADA con costo
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SupplyMovementType = 'ENTRADA' | 'SALIDA' | 'MERMA' | 'AJUSTE';

export interface RecetaLinea {
  supply_id: number;
  name: string;
  unit: string;
  image: string | null;
  quantity: string;
  cost_per_unit: string;
  line_cost: number;
  supply_active: boolean;
}

export interface Receta {
  menu_item_id: number;
  menu_item_name: string;
  price: number;
  lineas: RecetaLinea[];
  food_cost: number;
}

export interface InsumosReportRow {
  id: number;
  name: string;
  unit: string;
  cost_per_unit: string;
  consumo: string;
  merma: string;
  entradas: string;
  consumo_valor: string;
  merma_valor: string;
  compras_valor: string;
}

export interface InsumosReport {
  dias: number;
  por_insumo: InsumosReportRow[];
  totales: {
    consumo_valor: number;
    merma_valor: number;
    compras_valor: number;
    merma_pct: number;
    inventario_actual_valor: number;
  };
}

export interface SupplyMovement {
  id: number;
  supply_id: number;
  type: SupplyMovementType;
  quantity: string;
  stock_before: string;
  stock_after: string;
  unit_cost: string | null;
  note: string | null;
  admin_user_id: number | null;
  usuario?: string | null;
  created_at: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = getCurrentToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      clearSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.detail || body.mensaje || 'Error en la solicitud');
    }
    return body;
  }

  // Auth
  login(identificador: string, password: string) {
    return this.request<ApiEnvelope<{ token: string; usuario: AdminUser }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, password }),
    });
  }

  me() {
    return this.request<ApiEnvelope<AdminUser>>('/auth/me');
  }

  cambiarPassword(passwordActual: string, passwordNueva: string) {
    return this.request<ApiEnvelope<{ mensaje: string }>>('/auth/cambiar-password', {
      method: 'PUT',
      body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
    });
  }

  // Menu
  getMenuItems(params: { categoria?: string; activo?: boolean; busqueda?: string } = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<ApiEnvelope<MenuItem[]>>(`/menu${qs ? `?${qs}` : ''}`);
  }

  getMenuItem(id: string | number) {
    return this.request<ApiEnvelope<MenuItem>>(`/menu/${id}`);
  }

  createMenuItem(item: Partial<MenuItem>) {
    return this.request<ApiEnvelope<MenuItem>>('/menu', { method: 'POST', body: JSON.stringify(item) });
  }

  updateMenuItem(id: string | number, item: Partial<MenuItem>) {
    return this.request<ApiEnvelope<MenuItem>>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) });
  }

  deleteMenuItem(id: string | number) {
    return this.request<ApiEnvelope<{ mensaje: string }>>(`/menu/${id}`, { method: 'DELETE' });
  }

  // Orders
  getOrders(params: { estado?: string; telefono?: string; busqueda?: string; page?: number; page_size?: number } = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
    return this.request<ApiEnvelope<Order[]>>(`/orders${qs ? `?${qs}` : ''}`);
  }

  getOrder(id: string | number) {
    return this.request<ApiEnvelope<Order>>(`/orders/${id}`);
  }

  createOrder(order: unknown) {
    return this.request<ApiEnvelope<Order>>('/orders', { method: 'POST', body: JSON.stringify(order) });
  }

  editOrder(id: string | number, payload: {
    items: { menu_item_id: number; quantity: number; extra_ids?: number[]; special_instructions?: string | null }[];
    customer_phone?: string;
    delivery_address?: string;
    delivery_instructions?: string | null;
    notes?: string | null;
  }) {
    return this.request<ApiEnvelope<Order>>(`/orders/${id}/editar`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Cuenta de cliente (sesión propia, independiente del admin)
  private async cuentaRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { getClienteSesion } = await import('../utils/clienteSession');
    const sesion = getClienteSesion();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;

    const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
    const body = await response.json();
    if (!response.ok) throw new Error(body.detail || body.mensaje || 'Error de conexión');
    return body as T;
  }

  accesoCuenta(email: string, phone: string) {
    return this.cuentaRequest<ApiEnvelope<{ token: string; customer: any }>>('/cuenta/acceso', {
      method: 'POST',
      body: JSON.stringify({ email, phone }),
    });
  }

  getPerfilCuenta() {
    return this.cuentaRequest<ApiEnvelope<any>>('/cuenta/perfil');
  }

  getMisPedidos(page = 1, pageSize = 10) {
    return this.cuentaRequest<ApiEnvelope<Order[]> & { page: number; page_size: number }>(
      `/cuenta/pedidos?page=${page}&page_size=${pageSize}`
    );
  }

  // Lealtad
  consultarPuntos(phone: string) {
    return this.request<ApiEnvelope<{ points: number; valor_punto: number; valor_en_pesos: number }>>(
      `/loyalty/consulta?phone=${encodeURIComponent(phone)}`
    );
  }

  updateOrderStatus(id: string | number, status: string, notes?: string) {
    return this.request<ApiEnvelope<Order>>(`/orders/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  cancelOrder(id: string | number, reason: string) {
    return this.request<ApiEnvelope<Order>>(`/orders/${id}/cancelar`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  getOrderWhatsappLink(id: string | number) {
    return this.request<ApiEnvelope<{ url: string }>>(`/orders/${id}/whatsapp`);
  }

  // Pagos
  createPaymentPreference(orderId: string | number) {
    return this.request<ApiEnvelope<{ init_point: string; preference_id: string }>>('/payments/preference', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  }

  // Reviews
  createReview(review: unknown) {
    return this.request<ApiEnvelope<Review>>('/reviews', { method: 'POST', body: JSON.stringify(review) });
  }

  getReviews(status: string = 'approved') {
    return this.request<ApiEnvelope<Review[]>>(`/reviews?status=${status}`);
  }

  moderateReview(id: string | number, status: 'approved' | 'rejected') {
    return this.request<ApiEnvelope<Review>>(`/reviews/${id}/moderar`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Customers
  getCustomers(params: { q?: string; page?: number; page_size?: number } = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
    return this.request<ApiEnvelope<Customer[]>>(`/customers${qs ? `?${qs}` : ''}`);
  }

  getCustomer(id: string | number) {
    return this.request<ApiEnvelope<{ cliente: Customer; pedidos: Order[] }>>(`/customers/${id}`);
  }

  updateCustomer(id: string | number, data: Partial<Customer>) {
    return this.request<ApiEnvelope<Customer>>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // Reports
  getReport(nombre: 'dashboard' | 'ventas' | 'clientes' | 'productos' | 'cocina' | 'entregas' | 'caja') {
    return this.request<ApiEnvelope<unknown>>(`/reports/${nombre}`);
  }

  // Contact
  createContactMessage(data: unknown) {
    return this.request<ApiEnvelope<ContactMessage>>('/contact', { method: 'POST', body: JSON.stringify(data) });
  }

  getContactMessages(status?: string) {
    return this.request<ApiEnvelope<ContactMessage[]>>(`/contact${status ? `?status=${status}` : ''}`);
  }

  updateContactStatus(id: string | number, status: string) {
    return this.request<ApiEnvelope<ContactMessage>>(`/contact/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  }

  // Hero images
  getHeroImages(activo?: boolean) {
    const qs = activo === undefined ? '' : `?activo=${activo}`;
    return this.request<ApiEnvelope<HeroImage[]>>(`/hero${qs}`);
  }

  createHeroImage(data: Partial<HeroImage>) {
    return this.request<ApiEnvelope<HeroImage>>('/hero', { method: 'POST', body: JSON.stringify(data) });
  }

  updateHeroImage(id: string | number, data: Partial<HeroImage>) {
    return this.request<ApiEnvelope<HeroImage>>(`/hero/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteHeroImage(id: string | number) {
    return this.request<ApiEnvelope<{ mensaje: string }>>(`/hero/${id}`, { method: 'DELETE' });
  }

  // Admin users
  getAdminUsers() {
    return this.request<ApiEnvelope<AdminUser[]>>('/admin-users');
  }

  createAdminUser(data: {
    username: string;
    email: string;
    password: string;
    role: string;
    full_name: string;
    phone?: string;
  }) {
    return this.request<ApiEnvelope<AdminUser>>('/admin-users', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminUser(id: string | number, data: Partial<AdminUser>) {
    return this.request<ApiEnvelope<AdminUser>>(`/admin-users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deactivateAdminUser(id: string | number) {
    return this.request<ApiEnvelope<{ mensaje: string }>>(`/admin-users/${id}`, { method: 'DELETE' });
  }

  resetAdminUserPassword(id: string | number, newPassword: string) {
    return this.request<ApiEnvelope<{ mensaje: string }>>(`/admin-users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  // Audit log
  getAuditLog(params: { module?: string; admin_user_id?: number; page?: number; page_size?: number } = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
    return this.request<ApiEnvelope<AuditLogEntry[]>>(`/audit-log${qs ? `?${qs}` : ''}`);
  }

  getAuditLogModules() {
    return this.request<ApiEnvelope<string[]>>('/audit-log/modules');
  }

  // Insumos (inventario interno de cocina)
  getSupplies(params?: { activo?: boolean; bajo_stock?: boolean }) {
    const query = new URLSearchParams();
    if (params?.activo !== undefined) query.set('activo', String(params.activo));
    if (params?.bajo_stock) query.set('bajo_stock', 'true');
    const qs = query.toString();
    return this.request<ApiEnvelope<Supply[]>>(`/insumos${qs ? `?${qs}` : ''}`);
  }

  createSupply(data: { name: string; unit: string; image?: string | null; min_stock: string; cost_per_unit: string; supplier_name?: string | null; supplier_phone?: string | null; initial_stock: string }) {
    return this.request<ApiEnvelope<Supply>>('/insumos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateSupply(id: number, data: Partial<{ name: string; unit: string; image: string | null; min_stock: string; cost_per_unit: string; supplier_name: string | null; supplier_phone: string | null; is_active: boolean }>) {
    return this.request<ApiEnvelope<Supply>>(`/insumos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  createSupplyMovement(id: number, data: { type: SupplyMovementType; quantity: string; unit_cost?: string; note?: string }) {
    return this.request<ApiEnvelope<{ movimiento: SupplyMovement; insumo: Supply }>>(`/insumos/${id}/movimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  createConteo(lineas: { supply_id: number; counted: string }[], note?: string) {
    return this.request<ApiEnvelope<{ ajustados: { supply_id: number; name: string; antes: string; despues: string }[]; sin_cambio: number }>>(
      '/insumos/conteo',
      { method: 'POST', body: JSON.stringify({ lineas, note }) }
    );
  }

  getInsumosReport(dias = 30) {
    return this.request<ApiEnvelope<InsumosReport>>(`/reports/insumos?dias=${dias}`);
  }

  // Extras con precio por producto
  getExtras(menuItemId: number | string) {
    return this.request<ApiEnvelope<MenuExtra[]>>(`/menu/${menuItemId}/extras`);
  }

  updateExtras(menuItemId: number | string, extras: { name: string; price: number; is_active: boolean }[]) {
    return this.request<ApiEnvelope<MenuExtra[]>>(`/menu/${menuItemId}/extras`, {
      method: 'PUT',
      body: JSON.stringify({ extras }),
    });
  }

  // Cupones
  validateCoupon(code: string, subtotal: number) {
    return this.request<ApiEnvelope<{ code: string; type: 'PERCENT' | 'FIXED'; value: number; discount: number }>>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code, subtotal }) }
    );
  }

  getCoupons() {
    return this.request<ApiEnvelope<Coupon[]>>('/coupons');
  }

  createCoupon(data: Partial<Coupon>) {
    return this.request<ApiEnvelope<Coupon>>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateCoupon(id: number, data: Partial<Coupon>) {
    return this.request<ApiEnvelope<Coupon>>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Recetas (insumos por producto del menú)
  getReceta(menuItemId: number) {
    return this.request<ApiEnvelope<Receta>>(`/menu/${menuItemId}/receta`);
  }

  updateReceta(menuItemId: number, lineas: { supply_id: number; quantity: string }[]) {
    return this.request<ApiEnvelope<Receta>>(`/menu/${menuItemId}/receta`, {
      method: 'PUT',
      body: JSON.stringify({ lineas }),
    });
  }

  getSupplyMovements(id: number, page = 1, pageSize = 20) {
    return this.request<ApiEnvelope<SupplyMovement[]> & { total: number; page: number; page_size: number }>(
      `/insumos/${id}/movimientos?page=${page}&page_size=${pageSize}`
    );
  }

  // Settings
  getSettings() {
    return this.request<ApiEnvelope<unknown[]>>('/configuracion');
  }

  getPublicSettings() {
    return this.request<ApiEnvelope<Record<string, string>>>('/configuracion/publica');
  }

  updateSetting(clave: string, valor: string) {
    return this.request<ApiEnvelope<unknown>>(`/configuracion/${clave}`, {
      method: 'PUT',
      body: JSON.stringify({ setting_value: valor }),
    });
  }

  // Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = getCurrentToken();
    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const body = await response.json();
    if (!response.ok) throw new Error(body.detail || 'Error al subir la imagen');
    return body as ApiEnvelope<{ url: string; filename: string }>;
  }
}

const apiService = new ApiService();

export default apiService;
export { ApiService };
