import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { success, fail, parseProductFields } from "@/utils/response";
import { authMiddleware, adminMiddleware } from "@/middlewares/auth";

const router = Router();

// 商品分类列表
router.get("/categories", async (_req, res) => {
  const categories = await prisma.productCategory.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return success(res, categories);
});

// 商品列表（公开，支持分类筛选与分页）
router.get("/", async (req, res) => {
  const { categoryId, keyword, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = { status: "ON" };
  if (categoryId) where.categoryId = categoryId;
  if (keyword) where.name = { contains: keyword };

  const total = await prisma.product.count({ where });
  const list = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
  });
  return success(res, { list: list.map(parseProductFields), total, page: Number(page), pageSize: Number(pageSize) });
});

// 商品详情
router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) return fail(res, "商品不存在", 404, 404);
  return success(res, parseProductFields(product));
});

// 新增商品（管理员）
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, categoryId, description, image, price, stock, specs } = req.body;
  if (!name || !categoryId || price == null) {
    return fail(res, "缺少必填字段");
  }
  const product = await prisma.product.create({
    data: { name, categoryId, description: description ?? "", image: image ?? "", price: Number(price), stock: stock ?? 0, specs: specs ? JSON.stringify(specs) : null },
  });
  return success(res, parseProductFields(product), "创建成功");
});

// 编辑商品（管理员）
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, categoryId, description, image, price, stock, status, specs } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(categoryId !== undefined && { categoryId }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(status !== undefined && { status }),
      ...(specs !== undefined && { specs: JSON.stringify(specs) }),
    },
  });
  return success(res, parseProductFields(product), "更新成功");
});

// 删除商品（管理员）
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  return success(res, null, "删除成功");
});

export default router;
