import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { success, fail, parseOrderFields } from "@/utils/response";
import { authMiddleware, adminMiddleware } from "@/middlewares/auth";

const router = Router();

router.use(authMiddleware);

// 用户订单列表
router.get("/", async (req, res) => {
  const { status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (status) where.status = status;

  const total = await prisma.order.count({ where });
  const list = await prisma.order.findMany({
    where,
    include: { items: true, giftCard: { include: { template: true } } },
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
  });
  return success(res, { list: list.map(parseOrderFields), total, page: Number(page), pageSize: Number(pageSize) });
});

// 订单详情
router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, giftCard: { include: { template: true } }, user: { select: { username: true, email: true } } },
  });
  if (!order) return fail(res, "订单不存在", 404, 404);
  if (order.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return fail(res, "无权查看此订单", 403, 403);
  }
  return success(res, parseOrderFields(order));
});

// 更新订单状态（管理员）
router.put("/:id/status", adminMiddleware, async (req, res) => {
  const { status, trackingNumber, logisticsCompany } = req.body as {
    status: string;
    trackingNumber?: string;
    logisticsCompany?: string;
  };
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status: status as never,
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(logisticsCompany !== undefined && { logisticsCompany }),
    },
  });
  return success(res, parseOrderFields(order), "订单状态已更新");
});

export default router;
