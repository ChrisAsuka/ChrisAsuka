import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { success, fail, parseOrderFields, parseProductFields } from "@/utils/response";
import { authMiddleware, adminMiddleware } from "@/middlewares/auth";
import { generateUniqueCodes } from "@/utils/generate";

const router = Router();

// 所有后台接口需管理员权限
router.use(authMiddleware, adminMiddleware);

// ========== 仪表盘 ==========
router.get("/dashboard", async (_req, res) => {
  const [today, pending, totalAmount, cardCount, productCount, lowStock] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "SHIPPING"] } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.giftCard.count(),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lt: 20 } } }),
  ]);
  return success(res, {
    todayOrders: today,
    pendingOrders: pending,
    totalAmount: totalAmount._sum.totalAmount || 0,
    cardCount,
    productCount,
    lowStock,
  });
});

// ========== 礼品卡码管理 ==========
// 批量生成卡码
router.post("/gift-cards/generate", async (req, res) => {
  const { templateId, count, prefix } = req.body as { templateId: string; count: number; prefix?: string };
  if (!templateId || !count || count > 10000) {
    return fail(res, "请选择模板且生成数量不超过10000");
  }
  const template = await prisma.giftCardTemplate.findUnique({ where: { id: templateId } });
  if (!template) return fail(res, "模板不存在");

  const codes = generateUniqueCodes(count, prefix || "GC");
  const expiresAt = new Date(Date.now() + template.validDays * 24 * 60 * 60 * 1000);

  await prisma.giftCard.createMany({
    data: codes.map((code) => ({
      code,
      amount: template.amount,
      templateId,
      expiresAt,
    })),
  });
  return success(res, { codes, count: codes.length }, `成功生成 ${codes.length} 张礼品卡`);
});

// 卡码列表
router.get("/gift-cards", async (req, res) => {
  const { status, templateId, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (templateId) where.templateId = templateId;

  const total = await prisma.giftCard.count({ where });
  const list = await prisma.giftCard.findMany({
    where,
    include: { template: true },
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
  });
  return success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
});

// ========== 礼品卡分类 ==========
router.get("/categories", async (_req, res) => {
  const list = await prisma.giftCardCategory.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { templates: true } } } });
  return success(res, list);
});

router.post("/categories", async (req, res) => {
  const { name, description, icon, sort } = req.body;
  const cat = await prisma.giftCardCategory.create({ data: { name, description, icon: icon || "Gift", sort: sort || 0 } });
  return success(res, cat, "创建成功");
});

router.put("/categories/:id", async (req, res) => {
  const { name, description, icon, sort, enabled } = req.body;
  const cat = await prisma.giftCardCategory.update({
    where: { id: req.params.id },
    data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(icon !== undefined && { icon }), ...(sort !== undefined && { sort }), ...(enabled !== undefined && { enabled }) },
  });
  return success(res, cat, "更新成功");
});

router.delete("/categories/:id", async (req, res) => {
  await prisma.giftCardCategory.delete({ where: { id: req.params.id } });
  return success(res, null, "删除成功");
});

// ========== 礼品卡模板 ==========
router.get("/templates", async (_req, res) => {
  const list = await prisma.giftCardTemplate.findMany({
    include: { category: true, products: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return success(res, list.map((t) => ({
    ...t,
    products: t.products.map((tp) => ({ ...tp, product: parseProductFields(tp.product) })),
  })));
});

router.post("/templates", async (req, res) => {
  const { name, categoryId, amount, validDays, selectCount, maxQuantityPerProduct, productIds } = req.body;
  if (!name || !categoryId || !amount || !validDays || !selectCount || !productIds?.length) {
    return fail(res, "缺少必填字段");
  }
  const tpl = await prisma.giftCardTemplate.create({
    data: {
      name, categoryId, amount: Number(amount), validDays: Number(validDays),
      selectCount: Number(selectCount), maxQuantityPerProduct: maxQuantityPerProduct || 1,
      products: { create: productIds.map((pid: string) => ({ productId: pid })) },
    },
    include: { products: true },
  });
  return success(res, tpl, "创建成功");
});

router.put("/templates/:id", async (req, res) => {
  const { name, categoryId, amount, validDays, selectCount, maxQuantityPerProduct, productIds } = req.body;
  if (productIds) {
    await prisma.templateProduct.deleteMany({ where: { templateId: req.params.id } });
    await prisma.templateProduct.createMany({ data: productIds.map((pid: string) => ({ templateId: req.params.id, productId: pid })) });
  }
  const tpl = await prisma.giftCardTemplate.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }), ...(categoryId !== undefined && { categoryId }),
      ...(amount !== undefined && { amount: Number(amount) }), ...(validDays !== undefined && { validDays: Number(validDays) }),
      ...(selectCount !== undefined && { selectCount: Number(selectCount) }), ...(maxQuantityPerProduct !== undefined && { maxQuantityPerProduct }),
    },
  });
  return success(res, tpl, "更新成功");
});

router.delete("/templates/:id", async (req, res) => {
  await prisma.giftCardTemplate.delete({ where: { id: req.params.id } });
  return success(res, null, "删除成功");
});

// ========== 商品分类 ==========
router.get("/product-categories", async (_req, res) => {
  const list = await prisma.productCategory.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { products: true } } } });
  return success(res, list);
});

router.post("/product-categories", async (req, res) => {
  const { name, icon, sort, parentId } = req.body;
  const cat = await prisma.productCategory.create({ data: { name, icon: icon || "Package", sort: sort || 0, parentId } });
  return success(res, cat, "创建成功");
});

router.put("/product-categories/:id", async (req, res) => {
  const { name, icon, sort, parentId } = req.body;
  const cat = await prisma.productCategory.update({
    where: { id: req.params.id },
    data: { ...(name !== undefined && { name }), ...(icon !== undefined && { icon }), ...(sort !== undefined && { sort }), ...(parentId !== undefined && { parentId }) },
  });
  return success(res, cat, "更新成功");
});

router.delete("/product-categories/:id", async (req, res) => {
  await prisma.productCategory.delete({ where: { id: req.params.id } });
  return success(res, null, "删除成功");
});

// ========== 全部订单 ==========
router.get("/orders", async (req, res) => {
  const { status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const total = await prisma.order.count({ where });
  const list = await prisma.order.findMany({
    where,
    include: { items: true, user: { select: { username: true, email: true } }, giftCard: { include: { template: true } } },
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
  });
  return success(res, { list: list.map(parseOrderFields), total, page: Number(page), pageSize: Number(pageSize) });
});

// ========== 物流公司 ==========
router.get("/logistics", async (_req, res) => {
  const list = await prisma.logisticsCompany.findMany({ orderBy: { name: "asc" } });
  return success(res, list);
});

router.post("/logistics", async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return fail(res, "请填写物流公司名称和编码");
  const lc = await prisma.logisticsCompany.create({ data: { name, code } });
  return success(res, lc, "创建成功");
});

router.put("/logistics/:id", async (req, res) => {
  const { name, code, enabled } = req.body;
  const lc = await prisma.logisticsCompany.update({
    where: { id: req.params.id },
    data: { ...(name !== undefined && { name }), ...(code !== undefined && { code }), ...(enabled !== undefined && { enabled }) },
  });
  return success(res, lc, "更新成功");
});

router.delete("/logistics/:id", async (req, res) => {
  await prisma.logisticsCompany.delete({ where: { id: req.params.id } });
  return success(res, null, "删除成功");
});

export default router;
