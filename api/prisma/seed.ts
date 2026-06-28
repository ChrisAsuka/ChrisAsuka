import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;

async function main() {
  console.log("🌱 开始种子数据初始化...");

  // 管理员
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", email: "admin@giftcard.com", password: adminPassword, role: "ADMIN" },
  });

  // 测试用户
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { username: "member" },
    update: {},
    create: { username: "member", email: "member@giftcard.com", password: userPassword, role: "USER", balance: 0 },
  });

  // 商品分类
  const cat1 = await prisma.productCategory.upsert({ where: { id: "pc-1" }, update: {}, create: { id: "pc-1", name: "数码电子", icon: "Smartphone", sort: 1 } });
  const cat2 = await prisma.productCategory.upsert({ where: { id: "pc-2" }, update: {}, create: { id: "pc-2", name: "时尚生活", icon: "Shirt", sort: 2 } });
  const cat3 = await prisma.productCategory.upsert({ where: { id: "pc-3" }, update: {}, create: { id: "pc-3", name: "食品保健", icon: "Coffee", sort: 3 } });
  const cat4 = await prisma.productCategory.upsert({ where: { id: "pc-4" }, update: {}, create: { id: "pc-4", name: "礼品套装", icon: "Package", sort: 4 } });

  // 商品
  const products = [
    { id: "prod-1", name: "无线降噪蓝牙耳机", categoryId: cat1.id, description: "主动降噪，30小时续航，Hi-Res认证音质", image: img("premium wireless bluetooth headphones in elegant black with gold accents on white background"), price: 299, stock: 150, specs: { name: "颜色", values: ["曜石黑", "香槟金"] } },
    { id: "prod-2", name: "智能运动手表", categoryId: cat1.id, description: "AMOLED高清屏，心率血氧监测，50米防水", image: img("modern smartwatch with navy blue band and gold bezel on white background"), price: 499, stock: 80, specs: { name: "表带", values: ["运动版", "商务版"] } },
    { id: "prod-3", name: "便携快充充电宝", categoryId: cat1.id, description: "20000mAh，PD快充，双向快充协议", image: img("sleek portable power bank in dark navy with gold trim on white background"), price: 159, stock: 200, specs: null },
    { id: "prod-4", name: "高保真蓝牙音箱", categoryId: cat1.id, description: "360°环绕音效，IPX7防水，12小时续航", image: img("premium bluetooth speaker in champagne gold color on white background"), price: 359, stock: 60, specs: { name: "颜色", values: ["香槟金", "曜石黑"] } },
    { id: "prod-5", name: "真丝印花围巾", categoryId: cat2.id, description: "100%桑蚕丝，手工卷边，奢华印花设计", image: img("luxury silk scarf with elegant floral pattern in navy and gold on white background"), price: 288, stock: 45, specs: { name: "花色", values: ["鎏金花", "墨韵"] } },
    { id: "prod-6", name: "香薰蜡烛礼盒", categoryId: cat2.id, description: "天然大豆蜡，4款香型，精装礼盒", image: img("elegant scented candle gift set in navy box with gold label on white background"), price: 198, stock: 120, specs: null },
    { id: "prod-7", name: "钛金保温杯", categoryId: cat2.id, description: "316不锈钢内胆，24小时保温，真空双层", image: img("premium titanium thermos bottle in champagne gold on white background"), price: 168, stock: 90, specs: { name: "容量", values: ["350ml", "500ml"] } },
    { id: "prod-8", name: "精品手冲咖啡豆", categoryId: cat3.id, description: "埃塞俄比亚耶加雪菲，中度烘焙，250g", image: img("premium coffee beans bag with elegant gold packaging on white background"), price: 128, stock: 300, specs: { name: "烘焙度", values: ["浅烘", "中烘", "深烘"] } },
    { id: "prod-9", name: "有机蜂蜜礼盒", categoryId: cat3.id, description: "椴树蜜3瓶装，天然有机认证", image: img("organic honey gift box with three jars and gold ribbon on white background"), price: 158, stock: 75, specs: null },
    { id: "prod-10", name: "精选坚果礼篮", categoryId: cat4.id, description: "8种精选坚果，藤编礼篮，节庆优选", image: img("luxury nuts gift basket with mixed premium nuts and gold wrapping on white background"), price: 218, stock: 50, specs: null },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, specs: p.specs ? JSON.stringify(p.specs) : null },
    });
  }

  // 礼品卡分类
  const gcc1 = await prisma.giftCardCategory.upsert({ where: { id: "gcat-1" }, update: {}, create: { id: "gcat-1", name: "入门卡", description: "入门体验，100-300元面额", icon: "Sparkles", sort: 1 } });
  const gcc2 = await prisma.giftCardCategory.upsert({ where: { id: "gcat-2" }, update: {}, create: { id: "gcat-2", name: "标准卡", description: "标准尊享，300-800元面额", icon: "Gift", sort: 2 } });
  const gcc3 = await prisma.giftCardCategory.upsert({ where: { id: "gcat-3" }, update: {}, create: { id: "gcat-3", name: "尊享卡", description: "至臻尊享，800-2000元面额", icon: "Crown", sort: 3 } });

  // 礼品卡模板
  const tpl1 = await prisma.giftCardTemplate.upsert({
    where: { id: "tpl-1" },
    update: {},
    create: {
      id: "tpl-1", name: "入门体验卡", categoryId: gcc1.id, amount: 100, validDays: 90,
      selectCount: 2, maxQuantityPerProduct: 1,
      products: { create: ["prod-1", "prod-3", "prod-6", "prod-7", "prod-8", "prod-9"].map((pid) => ({ productId: pid })) },
    },
  });

  await prisma.giftCardTemplate.upsert({
    where: { id: "tpl-2" },
    update: {},
    create: {
      id: "tpl-2", name: "标准尊享卡", categoryId: gcc2.id, amount: 500, validDays: 180,
      selectCount: 3, maxQuantityPerProduct: 1,
      products: { create: ["prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6", "prod-7", "prod-8", "prod-9", "prod-10"].map((pid) => ({ productId: pid })) },
    },
  });

  await prisma.giftCardTemplate.upsert({
    where: { id: "tpl-3" },
    update: {},
    create: {
      id: "tpl-3", name: "至臻尊享卡", categoryId: gcc3.id, amount: 1000, validDays: 365,
      selectCount: 2, maxQuantityPerProduct: 2,
      products: { create: ["prod-2", "prod-4", "prod-5", "prod-6", "prod-7", "prod-10"].map((pid) => ({ productId: pid })) },
    },
  });

  // 示例礼品卡
  const expiresAt = new Date("2026-12-31T23:59:59Z");
  const cards = [
    { code: "GC2024A", amount: 100, templateId: tpl1.id },
    { code: "GC2024B", amount: 500, templateId: "tpl-2" },
    { code: "GC2024D", amount: 1000, templateId: "tpl-3" },
  ];
  for (const c of cards) {
    await prisma.giftCard.upsert({
      where: { code: c.code },
      update: { expiresAt, status: "ACTIVE", usedAt: null, userId: null },
      create: { code: c.code, amount: c.amount, templateId: c.templateId, expiresAt },
    });
  }

  // 物流公司
  const logistics = [
    { name: "顺丰速运", code: "SF" },
    { name: "京东物流", code: "JD" },
    { name: "中通快递", code: "ZTO" },
  ];
  for (const l of logistics) {
    const existing = await prisma.logisticsCompany.findUnique({ where: { code: l.code } });
    if (!existing) await prisma.logisticsCompany.create({ data: l });
  }

  console.log("✅ 种子数据初始化完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("管理员账号: admin / admin123");
  console.log("用户账号:   member / user123");
  console.log("测试礼品卡: GC2024A(¥100) GC2024B(¥500) GC2024D(¥1000)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
