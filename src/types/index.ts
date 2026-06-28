// 用户数据
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  createdAt: string;
}

// 礼品卡状态
export type GiftCardStatus = "active" | "used" | "expired";

// 礼品卡数据
export interface GiftCard {
  code: string;
  amount: number;
  status: GiftCardStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
  templateId: string;
}

// 礼品卡分类
export interface GiftCardCategory {
  id: string;
  name: string;
  icon: string;
  sort: number;
  enabled: boolean;
  amountRange: [number, number];
}

// 礼品卡模板（关联商品，N选M配置）
export interface GiftCardTemplate {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  validDays: number;
  productIds: string[];
  selectCount: number; // M: 用户必须选择的数量
  maxQuantityPerProduct: number;
  createdAt: string;
}

// 商品分类
export interface ProductCategory {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  sort: number;
}

// 商品规格
export interface ProductSpec {
  name: string;
  values: string[];
}

// 商品
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  status: "on" | "off";
  specs: ProductSpec[];
}

// 交易类型
export type TransactionType = "credit" | "debit";

// 交易记录
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  giftCardCode?: string;
  timestamp: string;
  balance: number;
}

// 订单状态
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipping"
  | "delivering"
  | "delivered"
  | "completed"
  | "refunding"
  | "refunded"
  | "returning"
  | "returned";

// 配送方式
export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedDays: string;
}

// 收货地址
export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

// 订单商品项
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  spec?: string;
}

// 订单
export interface Order {
  id: string;
  giftCardCode: string;
  items: OrderItem[];
  status: OrderStatus;
  address: Address;
  deliveryMethod: DeliveryMethod;
  totalAmount: number;
  createdAt: string;
  trackingNumber?: string;
  logisticsCompany?: string;
}

// 物流公司
export interface LogisticsCompany {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
}
