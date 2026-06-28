import express from "express";
import cors from "cors";
import morgan from "morgan";
import { logger } from "@/utils/logger";
import { errorHandler as globalErrorHandler } from "@/middlewares/error";
import authRoutes from "@/routes/auth";
import giftCardRoutes from "@/routes/giftCards";
import productRoutes from "@/routes/products";
import orderRoutes from "@/routes/orders";
import adminRoutes from "@/routes/admin";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// 中间件
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// 健康检查
app.get("/api/health", (_req, res) => res.json({ code: 0, message: "ok", data: { status: "running" } }));

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/gift-cards", giftCardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 错误处理（需在 errorHandler 中间件之前注册——修正：实际全局错误处理放最后）
app.use(globalErrorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 礼品卡兑换系统后端服务已启动: http://localhost:${PORT}`);
});

export default app;
