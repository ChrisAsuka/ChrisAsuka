import type { Response } from "express";

// 安全解析 JSON 字符串字段（SQLite 中以 String 存储，前端需要对象）
export function parseJSON<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// 解析商品/订单/地址相关 JSON 字符串字段
export function parseProductFields<T extends { specs?: string | null }>(p: T) {
  return { ...p, specs: parseJSON(p.specs, null) };
}

export function parseOrderFields<T extends { addressSnapshot?: string | null; deliveryMethod?: string | null }>(o: T) {
  return {
    ...o,
    addressSnapshot: parseJSON(o.addressSnapshot, null),
    deliveryMethod: parseJSON(o.deliveryMethod, null),
  };
}

export function success<T>(res: Response, data: T, message = "操作成功") {
  return res.json({ code: 0, message, data });
}

export function fail(res: Response, message: string, code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null });
}

export function paginate<T>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return res.json({
    code: 0,
    message: "操作成功",
    data: { list, total, page, pageSize },
  });
}
