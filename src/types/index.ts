// ========== 枚举 ==========
export type Role = "USER" | "ADMIN";
export type CardStatus = "ACTIVE" | "USED" | "EXPIRED";
export type ProductStatus = "ON" | "OFF";
export type TransactionType = "CREDIT" | "DEBIT";
export type OrderStatus =
  | "PAID"
  | "SHIPPING"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "REFUNDING"
  | "REFUNDED"
  | "RETURNING"
  | "RETURNED";

// ========== 用户 ==========
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

// ========== 礼品卡分类 ==========
export interface GiftCardCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  sort: number;
  enabled: boolean;
  createdAt: string;
  _count?: { templates: number };
}

// ========== 礼品卡模板 ==========
export interface GiftCardTemplate {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  validDays: number;
  selectCount: number;
  maxQuantityPerProduct: number;
  createdAt: string;
  category?: GiftCardCategory;
  products?: { product: Product }[];
  giftCards?: GiftCard[];
}

// ========== 礼品卡 ==========
export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  status: CardStatus;
  templateId: string;
  userId?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  template?: GiftCardTemplate;
}

// ========== 商品分类 ==========
export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  icon: string;
  sort: number;
  _count?: { products: number };
}

// ========== 商品 ==========
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  status: ProductStatus;
  specs?: unknown;
  createdAt: string;
  updatedAt?: string;
  category?: ProductCategory;
}

// ========== 订单 ==========
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  spec?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  giftCardId: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  addressSnapshot: AddressSnapshot;
  deliveryMethod: DeliveryMethodData;
  trackingNumber?: string;
  logisticsCompany?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  giftCard?: GiftCard & { template?: GiftCardTemplate };
  user?: { username: string; email: string };
}

export interface AddressSnapshot {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

export interface DeliveryMethodData {
  id: string;
  name: string;
  fee: number;
}

// ========== 配送方式（前端静态） ==========
export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedDays: string;
}

// ========== 收货地址 ==========
export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

// ========== 物流公司 ==========
export interface LogisticsCompany {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
}

// ========== 交易记录 ==========
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  giftCardCode?: string;
  balance: number;
  timestamp: string;
}
