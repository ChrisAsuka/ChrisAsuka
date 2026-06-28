// 生成订单号
export function generateOrderNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `ORD${y}${m}${d}${rand}`;
}

// 生成礼品卡码
export function generateGiftCardCode(prefix = "GC"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 批量生成唯一卡码
export function generateUniqueCodes(count: number, prefix = "GC"): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generateGiftCardCode(prefix));
  }
  return Array.from(set);
}
