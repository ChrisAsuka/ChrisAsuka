import type { GiftCard } from "@/types";

// 验证规则: 8位字母数字组合
const CODE_FORMAT = /^[A-Z0-9]{8}$/;

export function validateCodeFormat(code: string): boolean {
  return CODE_FORMAT.test(code.toUpperCase());
}

export function findGiftCard(code: string, cards: GiftCard[]): GiftCard | undefined {
  return cards.find((c) => c.code === code.toUpperCase());
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  card?: GiftCard;
}

export function validateGiftCard(code: string, cards: GiftCard[]): ValidationResult {
  const trimmedCode = code.trim().toUpperCase();

  if (!trimmedCode) {
    return { valid: false, error: "请输入礼品卡码" };
  }

  if (!validateCodeFormat(trimmedCode)) {
    return { valid: false, error: "礼品卡码格式不正确，请输入8位字母数字组合" };
  }

  const card = findGiftCard(trimmedCode, cards);

  if (!card) {
    return { valid: false, error: "礼品卡码不存在，请检查后重试" };
  }

  if (card.status === "used") {
    return { valid: false, error: "该礼品卡已被使用" };
  }

  if (card.status === "expired") {
    return { valid: false, error: "该礼品卡已过期" };
  }

  const now = new Date();
  if (new Date(card.expiresAt) < now) {
    return { valid: false, error: "该礼品卡已过期" };
  }

  return { valid: true, card };
}

// 生成交易ID
export function generateTransactionId(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

// 生成订单ID
export function generateOrderId(): string {
  return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
