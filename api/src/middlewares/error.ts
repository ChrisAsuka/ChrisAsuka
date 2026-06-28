import type { ErrorRequestHandler } from "express";
import { logger } from "@/utils/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  const status = err.status || 500;
  const message = status === 500 ? "服务器内部错误" : err.message;
  res.status(status).json({ code: 1, message, data: null });
};
