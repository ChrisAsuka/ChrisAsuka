import { create } from "zustand";
import type {
  User,
  GiftCard,
  Transaction,
  Order,
  Address,
  GiftCardTemplate,
  Product,
  DeliveryMethod,
  LogisticsCompany,
  OrderStatus,
} from "@/types";
import { storage, STORAGE_KEYS } from "@/services/storage";
import {
  defaultUser,
  sampleGiftCards,
  giftCardTemplates,
  products,
  deliveryMethods,
  logisticsCompanies,
} from "@/services/mockData";
import {
  validateGiftCard,
  generateTransactionId,
  generateOrderId,
} from "@/services/giftCard";

interface StoreState {
  // 数据
  user: User;
  giftCards: GiftCard[];
  transactions: Transaction[];
  orders: Order[];
  addresses: Address[];

  // 静态数据
  templates: GiftCardTemplate[];
  products: Product[];
  deliveryMethods: DeliveryMethod[];
  logisticsCompanies: LogisticsCompany[];

  // 初始化
  init: () => void;

  // 礼品卡兑换
  redeemGiftCard: (code: string) => { success: boolean; message: string };

  // 订单
  createOrder: (order: Omit<Order, "id" | "createdAt" | "status">) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // 地址管理
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;

  // 查询辅助
  getTemplate: (id: string) => GiftCardTemplate | undefined;
  getProduct: (id: string) => Product | undefined;
}

export const useStore = create<StoreState>((set, get) => ({
  user: defaultUser,
  giftCards: sampleGiftCards,
  transactions: [],
  orders: [],
  addresses: [],

  templates: giftCardTemplates,
  products,
  deliveryMethods,
  logisticsCompanies,

  init: () => {
    const initialized = storage.get(STORAGE_KEYS.INITIALIZED, false);
    if (!initialized) {
      storage.set(STORAGE_KEYS.USER, defaultUser);
      storage.set(STORAGE_KEYS.GIFT_CARDS, sampleGiftCards);
      storage.set(STORAGE_KEYS.TRANSACTIONS, []);
      storage.set(STORAGE_KEYS.ORDERS, []);
      storage.set(STORAGE_KEYS.ADDRESSES, []);
      storage.set(STORAGE_KEYS.INITIALIZED, true);
    }
    set({
      user: storage.get(STORAGE_KEYS.USER, defaultUser),
      giftCards: storage.get(STORAGE_KEYS.GIFT_CARDS, sampleGiftCards),
      transactions: storage.get(STORAGE_KEYS.TRANSACTIONS, []),
      orders: storage.get(STORAGE_KEYS.ORDERS, []),
      addresses: storage.get(STORAGE_KEYS.ADDRESSES, []),
    });
  },

  redeemGiftCard: (code) => {
    const { giftCards, user, transactions } = get();
    const result = validateGiftCard(code, giftCards);

    if (!result.valid || !result.card) {
      return { success: false, message: result.error || "兑换失败" };
    }

    const card = result.card;
    const now = new Date().toISOString();

    // 更新礼品卡状态
    const updatedCards = giftCards.map((c) =>
      c.code === card.code
        ? { ...c, status: "used" as const, usedAt: now, usedBy: user.id }
        : c,
    );

    // 更新用户余额
    const newBalance = user.balance + card.amount;
    const updatedUser = { ...user, balance: newBalance };

    // 创建交易记录
    const transaction: Transaction = {
      id: generateTransactionId(),
      type: "credit",
      amount: card.amount,
      description: `礼品卡兑换 - ${card.code}`,
      giftCardCode: card.code,
      timestamp: now,
      balance: newBalance,
    };
    const updatedTransactions = [transaction, ...transactions];

    // 持久化
    storage.set(STORAGE_KEYS.GIFT_CARDS, updatedCards);
    storage.set(STORAGE_KEYS.USER, updatedUser);
    storage.set(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

    set({
      giftCards: updatedCards,
      user: updatedUser,
      transactions: updatedTransactions,
    });

    return { success: true, message: `兑换成功！已到账 ¥${card.amount}` };
  },

  createOrder: (orderData) => {
    const order: Order = {
      ...orderData,
      id: generateOrderId(),
      status: "paid",
      createdAt: new Date().toISOString(),
    };
    const updatedOrders = [order, ...get().orders];
    storage.set(STORAGE_KEYS.ORDERS, updatedOrders);
    set({ orders: updatedOrders });
    return order;
  },

  updateOrderStatus: (orderId, status) => {
    const updatedOrders = get().orders.map((o) =>
      o.id === orderId ? { ...o, status } : o,
    );
    storage.set(STORAGE_KEYS.ORDERS, updatedOrders);
    set({ orders: updatedOrders });
  },

  addAddress: (addressData) => {
    const address: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    let updatedAddresses = get().addresses;
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses = [...updatedAddresses, address];
    storage.set(STORAGE_KEYS.ADDRESSES, updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  updateAddress: (id, addressData) => {
    let updatedAddresses = get().addresses.map((a) =>
      a.id === id ? { ...a, ...addressData } : a,
    );
    if (addressData.isDefault) {
      updatedAddresses = updatedAddresses.map((a) =>
        a.id === id ? a : { ...a, isDefault: false },
      );
    }
    storage.set(STORAGE_KEYS.ADDRESSES, updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  deleteAddress: (id) => {
    const updatedAddresses = get().addresses.filter((a) => a.id !== id);
    storage.set(STORAGE_KEYS.ADDRESSES, updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  getTemplate: (id) => get().templates.find((t) => t.id === id),
  getProduct: (id) => get().products.find((p) => p.id === id),
}));
