import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { success, fail, parseJSON, parseOrderFields } from "@/utils/response";
import { authMiddleware } from "@/middlewares/auth";
import { generateOrderNo } from "@/utils/generate";

const router = Router();

router.use(authMiddleware);

// 验证礼品卡码
router.post("/validate", async (req, res) => {
  const { code } = req.body as { code: string };
  if (!code) {
    return fail(res, "请输入礼品卡码");
  }

  const card = await prisma.giftCard.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      template: {
        include: {
          category: true,
          products: { include: { product: true } },
        },
      },
    },
  });

  if (!card) {
    return fail(res, "礼品卡码不存在");
  }
  if (card.status === "USED") {
    return fail(res, "该礼品卡已被使用");
  }
  if (card.status === "EXPIRED" || new Date(card.expiresAt) < new Date()) {
    return fail(res, "该礼品卡已过期");
  }

  return success(res, {
    code: card.code,
    amount: card.amount,
    expiresAt: card.expiresAt,
    template: {
      id: card.template.id,
      name: card.template.name,
      selectCount: card.template.selectCount,
      maxQuantityPerProduct: card.template.maxQuantityPerProduct,
      categoryName: card.template.category.name,
    },
    products: card.template.products.map((tp) => ({
      id: tp.product.id,
      name: tp.product.name,
      description: tp.product.description,
      image: tp.product.image,
      price: tp.product.price,
      stock: tp.product.stock,
      specs: parseJSON(tp.product.specs, null),
    })),
  }, "礼品卡有效");
});

// 兑换礼品卡（N选M，创建订单）
router.post("/redeem", async (req, res) => {
  const { code, items, address, deliveryMethod } = req.body as {
    code: string;
    items: { productId: string; quantity: number; spec?: string }[];
    address: { name: string; phone: string; province: string; city: string; district: string; detail: string };
    deliveryMethod: { id: string; name: string; fee: number };
  };

  if (!code || !items?.length || !address || !deliveryMethod) {
    return fail(res, "缺少必要参数");
  }

  const card = await prisma.giftCard.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      template: {
        include: { products: { include: { product: true } } },
      },
    },
  });

  if (!card || card.status !== "ACTIVE" || new Date(card.expiresAt) < new Date()) {
    return fail(res, "礼品卡无效或已使用");
  }

  const template = card.template;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  // N选M 校验：选择商品数量必须等于 selectCount
  const distinctProducts = new Set(items.map((i) => i.productId)).size;
  if (distinctProducts !== template.selectCount) {
    return fail(res, `请选择 ${template.selectCount} 件商品（N选M规则）`);
  }

  // 校验每件商品数量不超过上限
  for (const item of items) {
    if (item.quantity > template.maxQuantityPerProduct) {
      return fail(res, `单品数量不能超过 ${template.maxQuantityPerProduct} 件`);
    }
    const tp = template.products.find((p) => p.productId === item.productId);
    if (!tp) {
      return fail(res, "选择的商品不在礼品卡商品池中");
    }
    if (tp.product.stock < item.quantity) {
      return fail(res, `商品「${tp.product.name}」库存不足`);
    }
  }

  if (totalQuantity < 1) {
    return fail(res, "请至少选择一件商品");
  }

  // 事务：创建订单 + 扣库存 + 更新礼品卡状态
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNo: generateOrderNo(),
        giftCardId: card.id,
        userId: req.user!.userId,
        status: "PAID",
        totalAmount: card.amount,
        addressSnapshot: JSON.stringify(address),
        deliveryMethod: JSON.stringify(deliveryMethod),
        items: {
          create: items.map((item) => {
            const tp = template.products.find((p) => p.productId === item.productId)!;
            return {
              productId: item.productId,
              productName: tp.product.name,
              productImage: tp.product.image,
              quantity: item.quantity,
              spec: item.spec,
            };
          }),
        },
      },
      include: { items: true },
    });

    // 扣减库存
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 更新礼品卡状态
    await tx.giftCard.update({
      where: { id: card.id },
      data: { status: "USED", usedAt: new Date(), userId: req.user!.userId },
    });

    return created;
  });

  return success(res, parseOrderFields(order), "兑换成功，订单已生成");
});

export default router;
