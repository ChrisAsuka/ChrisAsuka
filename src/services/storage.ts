const PREFIX = "giftcard_system_";

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export const STORAGE_KEYS = {
  USER: "user",
  TRANSACTIONS: "transactions",
  GIFT_CARDS: "gift_cards",
  ORDERS: "orders",
  ADDRESSES: "addresses",
  INITIALIZED: "initialized",
} as const;
