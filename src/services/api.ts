import type {
  User,
  GiftCard,
  Product,
  ProductCategory,
  GiftCardCategory,
  GiftCardTemplate,
  Order,
  LogisticsCompany,
  OrderStatus,
} from "@/types";

const BASE = "/api";

let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function getToken() {
  return token;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || `请求失败 (${res.status})`);
  }
  return data.data as T;
}

// ========== 认证 ==========
export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { account: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  profile: () => request<User>("/auth/profile"),
};

// ========== 礼品卡 ==========
export interface GiftCardValidateResult {
  code: string;
  amount: number;
  expiresAt: string;
  template: { id: string; name: string; selectCount: number; maxQuantityPerProduct: number; categoryName: string };
  products: (Product & { specs: unknown })[];
}

export const giftCardApi = {
  validate: (code: string) =>
    request<GiftCardValidateResult>("/gift-cards/validate", { method: "POST", body: JSON.stringify({ code }) }),
  redeem: (body: {
    code: string;
    items: { productId: string; quantity: number; spec?: string }[];
    address: { name: string; phone: string; province: string; city: string; district: string; detail: string };
    deliveryMethod: { id: string; name: string; fee: number };
  }) => request<Order>("/gift-cards/redeem", { method: "POST", body: JSON.stringify(body) }),
};

// ========== 商品 ==========
export const productApi = {
  list: (params?: { categoryId?: string; keyword?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
    return request<{ list: Product[]; total: number; page: number; pageSize: number }>(`/products?${qs}`);
  },
  detail: (id: string) => request<Product>(`/products/${id}`),
  categories: () => request<(ProductCategory & { _count?: { products: number } })[]>("/products/categories"),
};

// ========== 订单 ==========
export const orderApi = {
  list: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
    return request<{ list: Order[]; total: number; page: number; pageSize: number }>(`/orders?${qs}`);
  },
  detail: (id: string) => request<Order>(`/orders/${id}`),
};

// ========== 管理后台 ==========
export interface DashboardData {
  todayOrders: number;
  pendingOrders: number;
  totalAmount: number;
  cardCount: number;
  productCount: number;
  lowStock: number;
}

export const adminApi = {
  dashboard: () => request<DashboardData>("/admin/dashboard"),

  // 礼品卡码
  generateCards: (body: { templateId: string; count: number; prefix?: string }) =>
    request<{ codes: string[]; count: number }>("/admin/gift-cards/generate", { method: "POST", body: JSON.stringify(body) }),
  listCards: (params?: { status?: string; templateId?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
    return request<{ list: (GiftCard & { template: GiftCardTemplate })[]; total: number; page: number; pageSize: number }>(`/admin/gift-cards?${qs}`);
  },

  // 礼品卡分类
  listCategories: () => request<(GiftCardCategory & { _count?: { templates: number } })[]>("/admin/categories"),
  createCategory: (body: Partial<GiftCardCategory>) => request("/admin/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Partial<GiftCardCategory>) => request(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request(`/admin/categories/${id}`, { method: "DELETE" }),

  // 模板
  listTemplates: () => request<(GiftCardTemplate & { category: GiftCardCategory; products: { product: Product }[] })[]>("/admin/templates"),
  createTemplate: (body: { name: string; categoryId: string; amount: number; validDays: number; selectCount: number; maxQuantityPerProduct?: number; productIds: string[] }) =>
    request("/admin/templates", { method: "POST", body: JSON.stringify(body) }),
  updateTemplate: (id: string, body: Record<string, unknown>) => request(`/admin/templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTemplate: (id: string) => request(`/admin/templates/${id}`, { method: "DELETE" }),

  // 商品分类
  listProductCategories: () => request<(ProductCategory & { _count?: { products: number } })[]>("/admin/product-categories"),
  createProductCategory: (body: Partial<ProductCategory>) => request("/admin/product-categories", { method: "POST", body: JSON.stringify(body) }),
  updateProductCategory: (id: string, body: Partial<ProductCategory>) => request(`/admin/product-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProductCategory: (id: string) => request(`/admin/product-categories/${id}`, { method: "DELETE" }),

  // 商品管理
  createProduct: (body: Record<string, unknown>) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: Record<string, unknown>) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),

  // 订单管理
  listAllOrders: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
    return request<{ list: Order[]; total: number; page: number; pageSize: number }>(`/admin/orders?${qs}`);
  },
  updateOrderStatus: (id: string, body: { status: OrderStatus; trackingNumber?: string; logisticsCompany?: string }) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify(body) }),

  // 物流公司
  listLogistics: () => request<LogisticsCompany[]>("/admin/logistics"),
  createLogistics: (body: { name: string; code: string }) => request("/admin/logistics", { method: "POST", body: JSON.stringify(body) }),
  updateLogistics: (id: string, body: Partial<LogisticsCompany>) => request(`/admin/logistics/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteLogistics: (id: string) => request(`/admin/logistics/${id}`, { method: "DELETE" }),
};
