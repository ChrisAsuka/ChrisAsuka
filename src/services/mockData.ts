import type {
  GiftCard,
  GiftCardCategory,
  GiftCardTemplate,
  Product,
  ProductCategory,
  DeliveryMethod,
  LogisticsCompany,
  User,
  Address,
} from "@/types";

const img = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=square`;

// 默认用户
export const defaultUser: User = {
  id: "user-001",
  username: "尊享会员",
  email: "member@giftcard.com",
  balance: 0,
  createdAt: "2024-01-15T08:00:00Z",
};

// 礼品卡分类
export const giftCardCategories: GiftCardCategory[] = [
  { id: "cat-1", name: "入门卡", icon: "Sparkles", sort: 1, enabled: true, amountRange: [100, 300] },
  { id: "cat-2", name: "标准卡", icon: "Gift", sort: 2, enabled: true, amountRange: [300, 800] },
  { id: "cat-3", name: "尊享卡", icon: "Crown", sort: 3, enabled: true, amountRange: [800, 2000] },
  { id: "cat-4", name: "定制卡", icon: "Star", sort: 4, enabled: true, amountRange: [0, 9999] },
];

// 商品分类
export const productCategories: ProductCategory[] = [
  { id: "pc-1", name: "数码电子", parentId: null, icon: "Smartphone", sort: 1 },
  { id: "pc-2", name: "时尚生活", parentId: null, icon: "Shirt", sort: 2 },
  { id: "pc-3", name: "食品保健", parentId: null, icon: "Coffee", sort: 3 },
  { id: "pc-4", name: "礼品套装", parentId: null, icon: "Package", sort: 4 },
];

// 商品列表
export const products: Product[] = [
  {
    id: "prod-1",
    name: "无线降噪蓝牙耳机",
    categoryId: "pc-1",
    description: "主动降噪，30小时续航，Hi-Res认证音质",
    image: img("premium wireless bluetooth headphones in elegant black with gold accents on white background"),
    price: 299,
    stock: 150,
    status: "on",
    specs: [{ name: "颜色", values: ["曜石黑", "香槟金"] }],
  },
  {
    id: "prod-2",
    name: "智能运动手表",
    categoryId: "pc-1",
    description: "AMOLED高清屏，心率血氧监测，50米防水",
    image: img("modern smartwatch with navy blue band and gold bezel on white background"),
    price: 499,
    stock: 80,
    status: "on",
    specs: [{ name: "表带", values: ["运动版", "商务版"] }],
  },
  {
    id: "prod-3",
    name: "便携快充充电宝",
    categoryId: "pc-1",
    description: "20000mAh，PD快充，双向快充协议",
    image: img("sleek portable power bank in dark navy with gold trim on white background"),
    price: 159,
    stock: 200,
    status: "on",
    specs: [],
  },
  {
    id: "prod-4",
    name: "高保真蓝牙音箱",
    categoryId: "pc-1",
    description: "360°环绕音效，IPX7防水，12小时续航",
    image: img("premium bluetooth speaker in champagne gold color on white background"),
    price: 359,
    stock: 60,
    status: "on",
    specs: [{ name: "颜色", values: ["香槟金", "曜石黑"] }],
  },
  {
    id: "prod-5",
    name: "真丝印花围巾",
    categoryId: "pc-2",
    description: "100%桑蚕丝，手工卷边，奢华印花设计",
    image: img("luxury silk scarf with elegant floral pattern in navy and gold on white background"),
    price: 288,
    stock: 45,
    status: "on",
    specs: [{ name: "花色", values: ["鎏金花", "墨韵"] }],
  },
  {
    id: "prod-6",
    name: "香薰蜡烛礼盒",
    categoryId: "pc-2",
    description: "天然大豆蜡，4款香型，精装礼盒",
    image: img("elegant scented candle gift set in navy box with gold label on white background"),
    price: 198,
    stock: 120,
    status: "on",
    specs: [],
  },
  {
    id: "prod-7",
    name: "钛金保温杯",
    categoryId: "pc-2",
    description: "316不锈钢内胆，24小时保温，真空双层",
    image: img("premium titanium thermos bottle in champagne gold on white background"),
    price: 168,
    stock: 90,
    status: "on",
    specs: [{ name: "容量", values: ["350ml", "500ml"] }],
  },
  {
    id: "prod-8",
    name: "精品手冲咖啡豆",
    categoryId: "pc-3",
    description: "埃塞俄比亚耶加雪菲，中度烘焙，250g",
    image: img("premium coffee beans bag with elegant gold packaging on white background"),
    price: 128,
    stock: 300,
    status: "on",
    specs: [{ name: "烘焙度", values: ["浅烘", "中烘", "深烘"] }],
  },
  {
    id: "prod-9",
    name: "有机蜂蜜礼盒",
    categoryId: "pc-3",
    description: "椴树蜜3瓶装，天然有机认证",
    image: img("organic honey gift box with three jars and gold ribbon on white background"),
    price: 158,
    stock: 75,
    status: "on",
    specs: [],
  },
  {
    id: "prod-10",
    name: "精选坚果礼篮",
    categoryId: "pc-4",
    description: "8种精选坚果，藤编礼篮，节庆优选",
    image: img("luxury nuts gift basket with mixed premium nuts and gold wrapping on white background"),
    price: 218,
    stock: 50,
    status: "on",
    specs: [],
  },
];

// 礼品卡模板
export const giftCardTemplates: GiftCardTemplate[] = [
  {
    id: "tpl-1",
    name: "入门体验卡",
    categoryId: "cat-1",
    amount: 100,
    validDays: 90,
    productIds: ["prod-1", "prod-3", "prod-6", "prod-7", "prod-8", "prod-9"],
    selectCount: 2,
    maxQuantityPerProduct: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tpl-2",
    name: "标准尊享卡",
    categoryId: "cat-2",
    amount: 500,
    validDays: 180,
    productIds: ["prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6", "prod-7", "prod-8", "prod-9", "prod-10"],
    selectCount: 3,
    maxQuantityPerProduct: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tpl-3",
    name: "至臻尊享卡",
    categoryId: "cat-3",
    amount: 1000,
    validDays: 365,
    productIds: ["prod-2", "prod-4", "prod-5", "prod-6", "prod-7", "prod-10"],
    selectCount: 2,
    maxQuantityPerProduct: 2,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// 示例礼品卡
export const sampleGiftCards: GiftCard[] = [
  {
    code: "GC2024A",
    amount: 100,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2025-12-31T23:59:59Z",
    templateId: "tpl-1",
  },
  {
    code: "GC2024B",
    amount: 500,
    status: "active",
    createdAt: "2024-02-01T00:00:00Z",
    expiresAt: "2025-12-31T23:59:59Z",
    templateId: "tpl-2",
  },
  {
    code: "GC2024C",
    amount: 500,
    status: "used",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2025-12-31T23:59:59Z",
    usedAt: "2024-06-15T10:30:00Z",
    usedBy: "user-001",
    templateId: "tpl-2",
  },
  {
    code: "GC2024D",
    amount: 1000,
    status: "active",
    createdAt: "2024-03-01T00:00:00Z",
    expiresAt: "2025-12-31T23:59:59Z",
    templateId: "tpl-3",
  },
];

// 配送方式
export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "dm-1",
    name: "标准配送",
    description: "3-5个工作日送达",
    fee: 0,
    estimatedDays: "3-5天",
  },
  {
    id: "dm-2",
    name: "加急配送",
    description: "1-2个工作日送达",
    fee: 15,
    estimatedDays: "1-2天",
  },
  {
    id: "dm-3",
    name: "尊享配送",
    description: "专人配送，当日达",
    fee: 30,
    estimatedDays: "当日",
  },
];

// 物流公司
export const logisticsCompanies: LogisticsCompany[] = [
  { id: "lc-1", name: "顺丰速运", code: "SF", enabled: true },
  { id: "lc-2", name: "京东物流", code: "JD", enabled: true },
  { id: "lc-3", name: "中通快递", code: "ZTO", enabled: true },
];

// 默认收货地址
export const defaultAddresses: Address[] = [];
