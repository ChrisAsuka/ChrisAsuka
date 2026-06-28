import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "@/utils/jwt";
import { fail } from "@/utils/response";

// 扩展 Request 类型，挂载用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 登录校验中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, "未登录，请先登录", 401, 401);
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return fail(res, "登录已过期，请重新登录", 401, 401);
  }
  req.user = payload;
  next();
}

// 管理员权限校验中间件
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "ADMIN") {
    return fail(res, "无权限执行此操作", 403, 403);
  }
  next();
}
