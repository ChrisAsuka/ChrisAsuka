# 数据库设计与 API 接口文档

> 礼品卡兑换系统核心交付文档
> 版本：v1.0
> 适用范围：开发交付、接口联调、运维参考

---

## 目录

- [第一章 数据库设计文档](#第一章-数据库设计文档)
  - [1.1 概述](#11-概述)
  - [1.2 ER 关系图](#12-er-关系图)
  - [1.3 数据表详细说明](#13-数据表详细说明)
  - [1.4 表关系说明](#14-表关系说明)
  - [1.5 索引说明](#15-索引说明)
- [第二章 API 接口文档](#第二章-api-接口文档)
  - [2.1 通用说明](#21-通用说明)
  - [2.2 认证模块](#22-认证模块)
  - [2.3 商品模块](#23-商品模块)
  - [2.4 礼品卡模块](#24-礼品卡模块)
  - [2.5 订单模块](#25-订单模块)
  - [2.6 管理后台模块](#26-管理后台模块)

---

# 第一章 数据库设计文档

## 1.1 概述

本系统使用 **Prisma ORM** 作为数据访问层，统一管理数据库模型、迁移与查询。考虑到开发与生产环境的差异，提供两份 Schema：

| 环境 | Schema 文件 | 数据库 | 字段类型差异 |
| --- | --- | --- | --- |
| 开发 | `api/prisma/schema.prisma` | SQLite | 枚举与 JSON 以 `String` / JSON 字符串存储 |
| 生产 | `api/prisma/schema-postgresql.prisma` | PostgreSQL | 原生 `enum` 与 `Json` 类型，类型安全更强 |

### 开发/生产差异说明

由于 SQLite 不支持原生枚举类型与 `Json` 类型，开发环境（SQLite）Schema 中：

- 所有枚举字段（如 `role`、`status`、`type`）使用 `String` 存储，注释中标注可选值；
- `Product.specs`、`Order.addressSnapshot`、`Order.deliveryMethod` 字段在 SQLite 中以 `String` 存储 JSON 字符串，由后端 `parseJSON` 工具函数在响应时反序列化；
- PostgreSQL 版本中上述字段使用真正的 `enum` 与 `Json` 类型，并由 `output = "../node_modules/.prisma/client"` 指定客户端生成路径。

> 切换到生产环境：执行 `npx prisma validate --schema prisma/schema-postgresql.prisma` 与 `npx prisma migrate dev --schema prisma/schema-postgresql.prisma`。

### 数据表总览

系统共定义 12 个数据模型：

| 序号 | 模型名 | 中文名 | 用途 |
| --- | --- | --- | --- |
| 1 | User | 用户 | 系统用户，区分 USER/ADMIN 角色 |
| 2 | GiftCardCategory | 礼品卡分类 | 礼品卡模板的分类归属 |
| 3 | GiftCardTemplate | 礼品卡模板 | N 选 M 配置：面额、有效期、可选商品池 |
| 4 | TemplateProduct | 模板-商品关联 | 模板与商品多对多中间表 |
| 5 | GiftCard | 礼品卡 | 实际卡码，含状态与有效期 |
| 6 | ProductCategory | 商品分类 | 商品分类（支持 parentId 层级） |
| 7 | Product | 商品 | 商品主档 |
| 8 | Order | 订单 | 兑换生成的订单主表 |
| 9 | OrderItem | 订单明细 | 订单中的商品快照行 |
| 10 | Transaction | 交易记录 | 用户余额变动流水 |
| 11 | Address | 收货地址 | 用户收货地址簿 |
| 12 | LogisticsCompany | 物流公司 | 物流公司主档 |

## 1.2 ER 关系图

```mermaid
erDiagram
    "User" ||--o{ "Transaction" : "拥有"
    "User" ||--o{ "Order" : "下单"
    "User" ||--o{ "Address" : "拥有"
    "User" ||--o{ "GiftCard" : "持有"
    "GiftCardCategory" ||--o{ "GiftCardTemplate" : "归属"
    "GiftCardTemplate" ||--o{ "TemplateProduct" : "包含商品"
    "Product" ||--o{ "TemplateProduct" : "被模板引用"
    "GiftCardTemplate" ||--o{ "GiftCard" : "实例化"
    "GiftCard" ||--o{ "Order" : "兑换产生"
    "ProductCategory" ||--o{ "Product" : "分类"
    "Product" ||--o{ "OrderItem" : "出现在订单明细"
    "Order" ||--o{ "OrderItem" : "包含明细"

    "User" {
        "String id" "PK UUID"
        "String username" "UK"
        "String email" "UK"
        "String password" "哈希"
        "String role" "USER|ADMIN"
        "String avatar" "可空"
        "Int balance" "默认0"
        "DateTime createdAt" "创建时间"
        "DateTime updatedAt" "更新时间"
    }

    "GiftCardCategory" {
        "String id" "PK UUID"
        "String name" "分类名"
        "String description" "可空"
        "String icon" "默认Gift"
        "Int sort" "排序"
        "Boolean enabled" "默认true"
        "DateTime createdAt" "创建时间"
    }

    "GiftCardTemplate" {
        "String id" "PK UUID"
        "String name" "模板名"
        "String categoryId" "FK"
        "Int amount" "面额"
        "Int validDays" "有效天数"
        "Int selectCount" "M值"
        "Int maxQuantityPerProduct" "单品上限"
        "DateTime createdAt" "创建时间"
    }

    "TemplateProduct" {
        "String id" "PK UUID"
        "String templateId" "FK"
        "String productId" "FK"
    }

    "GiftCard" {
        "String id" "PK UUID"
        "String code" "UK"
        "Int amount" "面额"
        "String status" "ACTIVE|USED|EXPIRED"
        "String templateId" "FK"
        "String userId" "FK可空"
        "DateTime createdAt" "创建时间"
        "DateTime expiresAt" "过期时间"
        "DateTime usedAt" "使用时间可空"
    }

    "ProductCategory" {
        "String id" "PK UUID"
        "String name" "分类名"
        "String parentId" "可空"
        "String icon" "默认Package"
        "Int sort" "排序"
    }

    "Product" {
        "String id" "PK UUID"
        "String name" "商品名"
        "String categoryId" "FK"
        "String description" "描述"
        "String image" "图片"
        "Int price" "价格"
        "Int stock" "库存"
        "String status" "ON|OFF"
        "String specs" "JSON可空"
        "DateTime createdAt" "创建时间"
        "DateTime updatedAt" "更新时间"
    }

    "Order" {
        "String id" "PK UUID"
        "String orderNo" "UK"
        "String giftCardId" "FK"
        "String userId" "FK"
        "String status" "订单状态枚举"
        "Int totalAmount" "订单总额"
        "String addressSnapshot" "JSON"
        "String deliveryMethod" "JSON"
        "String trackingNumber" "可空"
        "String logisticsCompany" "可空"
        "DateTime createdAt" "创建时间"
        "DateTime updatedAt" "更新时间"
    }

    "OrderItem" {
        "String id" "PK UUID"
        "String orderId" "FK"
        "String productId" "FK"
        "String productName" "快照"
        "String productImage" "快照"
        "Int quantity" "数量"
        "String spec" "规格可空"
    }

    "Transaction" {
        "String id" "PK UUID"
        "String userId" "FK"
        "String type" "CREDIT|DEBIT"
        "Int amount" "金额"
        "String description" "描述"
        "String giftCardCode" "可空"
        "Int balance" "变动后余额"
        "DateTime timestamp" "时间"
    }

    "Address" {
        "String id" "PK UUID"
        "String userId" "FK"
        "String name" "收件人"
        "String phone" "电话"
        "String province" "省"
        "String city" "市"
        "String district" "区"
        "String detail" "详细地址"
        "Boolean isDefault" "默认地址"
    }

    "LogisticsCompany" {
        "String id" "PK UUID"
        "String name" "公司名"
        "String code" "UK编码"
        "Boolean enabled" "启用"
    }
```

## 1.3 数据表详细说明

### 1.3.1 User（用户表）

存储系统所有用户，包括普通用户（USER）和管理员（ADMIN）。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 用户唯一标识 |
| username | String | UNIQUE, NOT NULL | - | 用户名（2-20 字符） |
| email | String | UNIQUE, NOT NULL | - | 邮箱地址 |
| password | String | NOT NULL | - | bcrypt 哈希后的密码 |
| role | String | NOT NULL | `"USER"` | 角色：`USER` / `ADMIN`（生产版为 `enum Role`） |
| avatar | String | 可空 | - | 头像 URL |
| balance | Int | NOT NULL | 0 | 用户余额（单位：分） |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |
| updatedAt | DateTime | NOT NULL | @updatedAt | 更新时间 |

**关联**：`transactions`、`orders`、`addresses`、`giftCards`（一对多）。

### 1.3.2 GiftCardCategory（礼品卡分类表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 分类唯一标识 |
| name | String | NOT NULL | - | 分类名称 |
| description | String | 可空 | - | 分类描述 |
| icon | String | NOT NULL | `"Gift"` | 图标名（前端图标库） |
| sort | Int | NOT NULL | 0 | 排序值（升序） |
| enabled | Boolean | NOT NULL | true | 是否启用 |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |

**关联**：`templates`（一对多）。

### 1.3.3 GiftCardTemplate（礼品卡模板表）

定义礼品卡的 N 选 M 兑换规则：用户兑换时必须从商品池中选择 `selectCount` 件商品，单件商品数量上限为 `maxQuantityPerProduct`。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 模板唯一标识 |
| name | String | NOT NULL | - | 模板名称 |
| categoryId | String | FK → GiftCardCategory.id, NOT NULL | - | 所属分类 |
| amount | Int | NOT NULL | - | 礼品卡面额（单位：分） |
| validDays | Int | NOT NULL | - | 有效期天数 |
| selectCount | Int | NOT NULL | - | 用户必须选择的商品数量（M 值） |
| maxQuantityPerProduct | Int | NOT NULL | 1 | 单品最大兑换数量 |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |

**关联**：`category`（多对一）、`products`（通过 TemplateProduct 多对多）、`giftCards`（一对多）。

### 1.3.4 TemplateProduct（模板-商品关联表）

礼品卡模板与商品的多对多中间表。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 关联记录标识 |
| templateId | String | FK → GiftCardTemplate.id, ON DELETE CASCADE | - | 模板 ID |
| productId | String | FK → Product.id | - | 商品 ID |

**约束**：`@@unique([templateId, productId])` —— 同一模板下同一商品唯一。

### 1.3.5 GiftCard（礼品卡表）

实际生成的礼品卡卡码实例。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 卡实例唯一标识 |
| code | String | UNIQUE, NOT NULL | - | 礼品卡码（大写，含前缀如 GC） |
| amount | Int | NOT NULL | - | 面额（来自模板） |
| status | String | NOT NULL | `"ACTIVE"` | 状态：`ACTIVE` / `USED` / `EXPIRED`（生产版为 `enum CardStatus`） |
| templateId | String | FK → GiftCardTemplate.id, NOT NULL | - | 来源模板 |
| userId | String | FK → User.id, 可空 | - | 持卡人（兑换后绑定） |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |
| expiresAt | DateTime | NOT NULL | - | 过期时间 |
| usedAt | DateTime | 可空 | - | 使用时间 |

**关联**：`template`（多对一）、`user`（多对一，可空）、`orders`（一对多）。

### 1.3.6 ProductCategory（商品分类表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 分类唯一标识 |
| name | String | NOT NULL | - | 分类名称 |
| parentId | String | 可空 | - | 父分类 ID（支持层级） |
| icon | String | NOT NULL | `"Package"` | 图标名 |
| sort | Int | NOT NULL | 0 | 排序值（升序） |

**关联**：`products`（一对多）。

### 1.3.7 Product（商品表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 商品唯一标识 |
| name | String | NOT NULL | - | 商品名称 |
| categoryId | String | FK → ProductCategory.id, NOT NULL | - | 所属分类 |
| description | String | NOT NULL | - | 商品描述 |
| image | String | NOT NULL | - | 商品图片 URL |
| price | Int | NOT NULL | - | 商品价格（单位：分） |
| stock | Int | NOT NULL | 0 | 库存数量 |
| status | String | NOT NULL | `"ON"` | 上架状态：`ON` / `OFF`（生产版为 `enum ProductStatus`） |
| specs | String | 可空 | - | 规格信息（SQLite 中以 JSON 字符串存储；生产版为 `Json`） |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |
| updatedAt | DateTime | NOT NULL | @updatedAt | 更新时间 |

**关联**：`category`（多对一）、`templateProducts`（多对多反向）、`orderItems`（一对多）。

### 1.3.8 Order（订单表）

用户兑换礼品卡后生成的订单，状态机覆盖完整履约流程。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 订单唯一标识 |
| orderNo | String | UNIQUE, NOT NULL | - | 订单号（格式 `ORD{YYYYMMDD}{6位随机}`） |
| giftCardId | String | FK → GiftCard.id, NOT NULL | - | 兑换所用礼品卡 |
| userId | String | FK → User.id, NOT NULL | - | 下单用户 |
| status | String | NOT NULL | `"PAID"` | 订单状态：见下方枚举 |
| totalAmount | Int | NOT NULL | - | 订单总额（单位：分） |
| addressSnapshot | String | NOT NULL | - | 收货地址快照（JSON 字符串；生产版为 `Json`） |
| deliveryMethod | String | NOT NULL | - | 配送方式快照（JSON 字符串；生产版为 `Json`） |
| trackingNumber | String | 可空 | - | 物流单号 |
| logisticsCompany | String | 可空 | - | 物流公司 |
| createdAt | DateTime | NOT NULL | now() | 创建时间 |
| updatedAt | DateTime | NOT NULL | @updatedAt | 更新时间 |

**订单状态枚举**（生产版 `enum OrderStatus`）：

| 状态 | 含义 |
| --- | --- |
| PAID | 已支付（兑换初始状态） |
| SHIPPING | 待发货 |
| DELIVERING | 配送中 |
| DELIVERED | 已送达 |
| COMPLETED | 已完成 |
| REFUNDING | 退款中 |
| REFUNDED | 已退款 |
| RETURNING | 退货中 |
| RETURNED | 已退货 |

**关联**：`giftCard`（多对一）、`user`（多对一）、`items`（一对多）。

### 1.3.9 OrderItem（订单明细表）

订单中的商品快照行，记录下单时的商品信息。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 明细唯一标识 |
| orderId | String | FK → Order.id, ON DELETE CASCADE | - | 所属订单 |
| productId | String | FK → Product.id | - | 商品 ID |
| productName | String | NOT NULL | - | 商品名称快照 |
| productImage | String | NOT NULL | - | 商品图片快照 |
| quantity | Int | NOT NULL | - | 购买数量 |
| spec | String | 可空 | - | 规格（如颜色、尺寸） |

**关联**：`order`（多对一，级联删除）、`product`（多对一）。

### 1.3.10 Transaction（交易记录表）

记录用户余额变动流水。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 交易记录唯一标识 |
| userId | String | FK → User.id, NOT NULL | - | 用户 ID |
| type | String | NOT NULL | - | 交易类型：`CREDIT`（入账）/ `DEBIT`（出账）（生产版为 `enum TransactionType`） |
| amount | Int | NOT NULL | - | 变动金额（单位：分） |
| description | String | NOT NULL | - | 交易描述 |
| giftCardCode | String | 可空 | - | 关联的礼品卡码（如有） |
| balance | Int | NOT NULL | - | 变动后余额 |
| timestamp | DateTime | NOT NULL | now() | 交易时间 |

**关联**：`user`（多对一）。

### 1.3.11 Address（收货地址表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 地址唯一标识 |
| userId | String | FK → User.id, NOT NULL | - | 所属用户 |
| name | String | NOT NULL | - | 收件人姓名 |
| phone | String | NOT NULL | - | 联系电话 |
| province | String | NOT NULL | - | 省 |
| city | String | NOT NULL | - | 市 |
| district | String | NOT NULL | - | 区/县 |
| detail | String | NOT NULL | - | 详细地址 |
| isDefault | Boolean | NOT NULL | false | 是否默认地址 |

**关联**：`user`（多对一）。

### 1.3.12 LogisticsCompany（物流公司表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | String | PK, UUID | uuid() | 物流公司唯一标识 |
| name | String | NOT NULL | - | 公司名称 |
| code | String | UNIQUE, NOT NULL | - | 公司编码（对接第三方查询） |
| enabled | Boolean | NOT NULL | true | 是否启用 |

## 1.4 表关系说明

| 主表 | 关系 | 从表 | 基数 | 外键字段 | 删除策略 |
| --- | --- | --- | --- | --- | --- |
| User | → | Transaction | 1:N | Transaction.userId | - |
| User | → | Order | 1:N | Order.userId | - |
| User | → | Address | 1:N | Address.userId | - |
| User | → | GiftCard | 1:N | GiftCard.userId（可空） | - |
| GiftCardCategory | → | GiftCardTemplate | 1:N | GiftCardTemplate.categoryId | - |
| GiftCardTemplate | ↔ | Product | M:N | TemplateProduct（中间表） | 中间表 ON DELETE CASCADE |
| GiftCardTemplate | → | GiftCard | 1:N | GiftCard.templateId | - |
| GiftCard | → | Order | 1:N | Order.giftCardId | - |
| ProductCategory | → | Product | 1:N | Product.categoryId | - |
| Product | → | OrderItem | 1:N | OrderItem.productId | - |
| Order | → | OrderItem | 1:N | OrderItem.orderId | ON DELETE CASCADE |

## 1.5 索引说明

系统在 Prisma Schema 中显式定义了以下索引以优化高频查询场景：

| 表名 | 索引字段 | 类型 | 用途 |
| --- | --- | --- | --- |
| User | username | UNIQUE | 用户名唯一约束 / 登录查询 |
| User | email | UNIQUE | 邮箱唯一约束 / 登录查询 |
| GiftCard | code | UNIQUE | 礼品卡码唯一约束 / 兑换校验 |
| GiftCard | status | INDEX | 后台按状态筛选卡码 |
| Order | userId | INDEX | 用户订单列表查询 |
| Order | status | INDEX | 后台按状态筛选订单 |
| Order | orderNo | UNIQUE | 订单号唯一约束 |
| TemplateProduct | (templateId, productId) | UNIQUE | 防止模板-商品重复关联 |
| LogisticsCompany | code | UNIQUE | 物流公司编码唯一 |

> 其余外键字段（如 `categoryId`、`templateId`、`giftCardId` 等）由 Prisma 自动维护关联关系，数据库层面未显式声明索引；如生产环境出现性能瓶颈，建议通过 Prisma 迁移补充。

---

# 第二章 API 接口文档

## 2.1 通用说明

### 2.1.1 基础信息

| 项目 | 说明 |
| --- | --- |
| 基础路径 | `/api` |
| 请求格式 | `application/json`（除 GET 请求外，请求体须为 JSON） |
| 字符编码 | UTF-8 |
| 默认端口 | 3000（开发环境） |

### 2.1.2 鉴权方式

系统使用 **JWT（JSON Web Token）** 鉴权，签发有效期 **7 天**。

- 客户端在请求头携带：`Authorization: Bearer <token>`
- Token 由 `/api/auth/register` 或 `/api/auth/login` 接口返回
- Token Payload 包含 `userId` 与 `role` 两个字段

### 2.1.3 角色与权限

| 角色 | 标识 | 权限范围 |
| --- | --- | --- |
| 普通用户 | `USER` | 注册/登录、商品浏览、礼品卡验证与兑换、查看本人订单 |
| 管理员 | `ADMIN` | 包含 USER 全部权限，另可访问 `/api/admin/*` 后台接口、管理商品/订单状态 |

接口权限标注说明：

- **公开**：无需 Token
- **USER**：需携带有效 Token（USER 或 ADMIN 均可）
- **ADMIN**：需携带 ADMIN 角色 Token

### 2.1.4 统一响应格式

所有接口均返回如下 JSON 结构：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | number | `0` 表示成功，非 `0` 表示失败 |
| message | string | 提示信息 |
| data | any \| null | 业务数据，失败时为 `null` |

分页接口的 `data` 统一为：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### 2.1.5 错误码

| HTTP 状态码 | code | 说明 |
| --- | --- | --- |
| 200 | 0 | 成功 |
| 400 | 1 | 业务错误（参数缺失、校验失败、库存不足等） |
| 401 | 401 | 未登录或 Token 已过期 |
| 403 | 403 | 无权限执行此操作 |
| 404 | 404 | 资源不存在 |
| 500 | 1 | 服务器内部错误 |

### 2.1.6 通用错误响应示例

```json
{
  "code": 1,
  "message": "未登录，请先登录",
  "data": null
}
```

---

## 2.2 认证模块

基础路径：`/api/auth`

### 2.2.1 用户注册

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/auth/register` |
| 鉴权 | 公开 |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名（2-20 字符） |
| email | string | 是 | 邮箱（合法邮箱格式） |
| password | string | 是 | 密码（6-32 字符） |

**请求示例**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-xxx",
      "username": "alice",
      "email": "alice@example.com",
      "role": "USER",
      "balance": 0
    }
  }
}
```

### 2.2.2 用户登录

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/auth/login` |
| 鉴权 | 公开 |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| account | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**请求示例**

```json
{
  "account": "alice@example.com",
  "password": "secret123"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-xxx",
      "username": "alice",
      "email": "alice@example.com",
      "role": "USER",
      "balance": 0,
      "avatar": null
    }
  }
}
```

### 2.2.3 获取当前用户信息

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/auth/profile` |
| 鉴权 | USER |

**请求参数**：无（通过 Token 解析 userId）

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": "uuid-xxx",
    "username": "alice",
    "email": "alice@example.com",
    "role": "USER",
    "balance": 0,
    "avatar": null,
    "createdAt": "2026-06-28T10:00:00.000Z"
  }
}
```

---

## 2.3 商品模块

基础路径：`/api/products`

### 2.3.1 商品分类列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/products/categories` |
| 鉴权 | 公开 |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": "uuid-xxx",
      "name": "数码",
      "parentId": null,
      "icon": "Package",
      "sort": 0,
      "_count": { "products": 12 }
    }
  ]
}
```

### 2.3.2 商品列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/products` |
| 鉴权 | 公开 |

**请求参数（Query）**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| categoryId | string | 否 | - | 商品分类 ID 筛选 |
| keyword | string | 否 | - | 商品名称模糊搜索 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "uuid-xxx",
        "name": "无线耳机",
        "categoryId": "uuid-xxx",
        "description": "...",
        "image": "https://...",
        "price": 19900,
        "stock": 50,
        "status": "ON",
        "specs": null,
        "createdAt": "2026-06-28T10:00:00.000Z",
        "updatedAt": "2026-06-28T10:00:00.000Z",
        "category": { "id": "uuid-xxx", "name": "数码" }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

> 仅返回 `status = "ON"` 的上架商品。

### 2.3.3 商品详情

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/products/:id` |
| 鉴权 | 公开 |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 商品 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": "uuid-xxx",
    "name": "无线耳机",
    "categoryId": "uuid-xxx",
    "description": "...",
    "image": "https://...",
    "price": 19900,
    "stock": 50,
    "status": "ON",
    "specs": { "color": "black" },
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z",
    "category": { "id": "uuid-xxx", "name": "数码" }
  }
}
```

### 2.3.4 新增商品

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/products` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 商品名称 |
| categoryId | string | 是 | 商品分类 ID |
| description | string | 否 | 商品描述（默认空字符串） |
| image | string | 否 | 商品图片 URL（默认空字符串） |
| price | number | 是 | 商品价格（单位：分） |
| stock | number | 否 | 库存（默认 0） |
| specs | object | 否 | 规格信息对象（存储为 JSON） |

**请求示例**

```json
{
  "name": "无线耳机",
  "categoryId": "uuid-xxx",
  "description": "蓝牙5.0降噪耳机",
  "image": "https://cdn.example.com/earphone.jpg",
  "price": 19900,
  "stock": 100,
  "specs": { "color": "black", "battery": "24h" }
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "uuid-xxx",
    "name": "无线耳机",
    "specs": { "color": "black", "battery": "24h" }
  }
}
```

### 2.3.5 编辑商品

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/products/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 商品 ID |

**请求参数（Body，均为可选字段，按需传入）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 商品名称 |
| categoryId | string | 商品分类 ID |
| description | string | 商品描述 |
| image | string | 商品图片 URL |
| price | number | 商品价格 |
| stock | number | 库存 |
| status | string | 上架状态：`ON` / `OFF` |
| specs | object | 规格信息对象 |

**请求示例**

```json
{
  "price": 18900,
  "stock": 80,
  "status": "ON"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": "uuid-xxx", "name": "无线耳机", "specs": null }
}
```

### 2.3.6 删除商品

| 项目 | 说明 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/products/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 商品 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

## 2.4 礼品卡模块

基础路径：`/api/gift-cards`

> 本模块所有接口均需 USER 鉴权。

### 2.4.1 验证礼品卡码

校验礼品卡是否有效，并返回该卡对应的模板配置与可选商品池（用于 N 选 M 兑换）。

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/gift-cards/validate` |
| 鉴权 | USER |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| code | string | 是 | 礼品卡码（不区分大小写，后端自动转大写） |

**请求示例**

```json
{ "code": "GCAB2345" }
```

**响应示例**

```json
{
  "code": 0,
  "message": "礼品卡有效",
  "data": {
    "code": "GCAB2345",
    "amount": 10000,
    "expiresAt": "2027-06-28T10:00:00.000Z",
    "template": {
      "id": "tpl-uuid",
      "name": "新春福利套餐",
      "selectCount": 3,
      "maxQuantityPerProduct": 2,
      "categoryName": "新春"
    },
    "products": [
      {
        "id": "prod-uuid",
        "name": "无线耳机",
        "description": "...",
        "image": "https://...",
        "price": 19900,
        "stock": 50,
        "specs": { "color": "black" }
      }
    ]
  }
}
```

**业务校验**：

- 卡码不存在 → 返回 "礼品卡码不存在"
- 状态为 `USED` → 返回 "该礼品卡已被使用"
- 状态为 `EXPIRED` 或已过期 → 返回 "该礼品卡已过期"

### 2.4.2 兑换礼品卡

根据 N 选 M 规则从礼品卡可选商品池中选择商品，生成订单并扣减库存、将礼品卡置为 `USED`。整个流程在数据库事务中完成。

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/gift-cards/redeem` |
| 鉴权 | USER |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| code | string | 是 | 礼品卡码 |
| items | array | 是 | 兑换商品列表 |
| items[].productId | string | 是 | 商品 ID |
| items[].quantity | number | 是 | 数量 |
| items[].spec | string | 否 | 规格 |
| address | object | 是 | 收货地址快照 |
| address.name | string | 是 | 收件人 |
| address.phone | string | 是 | 电话 |
| address.province | string | 是 | 省 |
| address.city | string | 是 | 市 |
| address.district | string | 是 | 区 |
| address.detail | string | 是 | 详细地址 |
| deliveryMethod | object | 是 | 配送方式快照 |
| deliveryMethod.id | string | 是 | 配送方式 ID |
| deliveryMethod.name | string | 是 | 配送方式名称 |
| deliveryMethod.fee | number | 是 | 运费 |

**请求示例**

```json
{
  "code": "GCAB2345",
  "items": [
    { "productId": "prod-uuid-1", "quantity": 1 },
    { "productId": "prod-uuid-2", "quantity": 2, "spec": "红色" }
  ],
  "address": {
    "name": "张三",
    "phone": "13800138000",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "detail": "科技园 X 栋 1001"
  },
  "deliveryMethod": {
    "id": "dm-001",
    "name": "顺丰快递",
    "fee": 0
  }
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "兑换成功，订单已生成",
  "data": {
    "id": "order-uuid",
    "orderNo": "ORD20260628123456",
    "giftCardId": "card-uuid",
    "userId": "user-uuid",
    "status": "PAID",
    "totalAmount": 10000,
    "addressSnapshot": {
      "name": "张三",
      "phone": "13800138000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detail": "科技园 X 栋 1001"
    },
    "deliveryMethod": { "id": "dm-001", "name": "顺丰快递", "fee": 0 },
    "trackingNumber": null,
    "logisticsCompany": null,
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid",
        "orderId": "order-uuid",
        "productId": "prod-uuid-1",
        "productName": "无线耳机",
        "productImage": "https://...",
        "quantity": 1,
        "spec": null
      }
    ]
  }
}
```

**业务校验规则**：

- 礼品卡不存在 / 已使用 / 已过期 → 失败
- 选择的商品种类数必须等于模板 `selectCount`（N 选 M）→ 否则返回 "请选择 N 件商品"
- 单品数量不能超过模板 `maxQuantityPerProduct` → 否则返回 "单品数量不能超过 N 件"
- 选择的商品必须在模板商品池中 → 否则返回 "选择的商品不在礼品卡商品池中"
- 商品库存必须 ≥ 请求数量 → 否则返回 "商品「X」库存不足"

**事务执行内容**：

1. 创建订单及订单明细（商品快照）
2. 扣减各商品库存
3. 更新礼品卡状态为 `USED`，写入 `usedAt` 与 `userId`

---

## 2.5 订单模块

基础路径：`/api/orders`

> 本模块所有接口均需 USER 鉴权；订单状态更新需 ADMIN 鉴权。

### 2.5.1 用户订单列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/orders` |
| 鉴权 | USER |

**请求参数（Query）**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| status | string | 否 | - | 订单状态筛选 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "order-uuid",
        "orderNo": "ORD20260628123456",
        "giftCardId": "card-uuid",
        "userId": "user-uuid",
        "status": "PAID",
        "totalAmount": 10000,
        "addressSnapshot": { "name": "张三" },
        "deliveryMethod": { "id": "dm-001", "name": "顺丰快递", "fee": 0 },
        "trackingNumber": null,
        "logisticsCompany": null,
        "createdAt": "2026-06-28T10:00:00.000Z",
        "updatedAt": "2026-06-28T10:00:00.000Z",
        "items": [],
        "giftCard": {
          "id": "card-uuid",
          "code": "GCAB2345",
          "template": { "id": "tpl-uuid", "name": "新春福利套餐" }
        }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

> 仅返回当前登录用户的订单。

### 2.5.2 订单详情

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/orders/:id` |
| 鉴权 | USER |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 订单 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": "order-uuid",
    "orderNo": "ORD20260628123456",
    "status": "PAID",
    "totalAmount": 10000,
    "addressSnapshot": { "name": "张三" },
    "deliveryMethod": { "id": "dm-001", "name": "顺丰快递", "fee": 0 },
    "trackingNumber": "SF1234567890",
    "logisticsCompany": "顺丰",
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid",
        "productId": "prod-uuid",
        "productName": "无线耳机",
        "productImage": "https://...",
        "quantity": 1,
        "spec": null
      }
    ],
    "giftCard": {
      "id": "card-uuid",
      "code": "GCAB2345",
      "template": { "id": "tpl-uuid", "name": "新春福利套餐" }
    },
    "user": { "username": "alice", "email": "alice@example.com" }
  }
}
```

**权限说明**：普通用户仅可查看自己的订单，管理员可查看任意订单。越权访问返回 403。

### 2.5.3 更新订单状态

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/orders/:id/status` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 订单 ID |

**请求参数（Body）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| status | string | 是 | 新状态（见订单状态枚举） |
| trackingNumber | string | 否 | 物流单号 |
| logisticsCompany | string | 否 | 物流公司 |

**请求示例**

```json
{
  "status": "SHIPPING",
  "trackingNumber": "SF1234567890",
  "logisticsCompany": "顺丰"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "订单状态已更新",
  "data": {
    "id": "order-uuid",
    "orderNo": "ORD20260628123456",
    "status": "SHIPPING",
    "trackingNumber": "SF1234567890",
    "logisticsCompany": "顺丰"
  }
}
```

---

## 2.6 管理后台模块

基础路径：`/api/admin`

> 本模块所有接口均需 ADMIN 鉴权。

### 2.6.1 仪表盘

获取后台首页所需的统计数据。

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/dashboard` |
| 鉴权 | ADMIN |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "todayOrders": 12,
    "pendingOrders": 5,
    "totalAmount": 120000,
    "cardCount": 1500,
    "productCount": 80,
    "lowStock": 8
  }
}
```

| 字段 | 说明 |
| --- | --- |
| todayOrders | 今日订单数（含今日 0 点起） |
| pendingOrders | 待处理订单数（状态为 `PAID` 或 `SHIPPING`） |
| totalAmount | 全部订单总额 |
| cardCount | 礼品卡总数 |
| productCount | 商品总数 |
| lowStock | 库存预警商品数（库存 < 20） |

### 2.6.2 卡码管理

#### 2.6.2.1 批量生成卡码

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/admin/gift-cards/generate` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| templateId | string | 是 | - | 礼品卡模板 ID |
| count | number | 是 | - | 生成数量（≤ 10000） |
| prefix | string | 否 | `GC` | 卡码前缀 |

**请求示例**

```json
{
  "templateId": "tpl-uuid",
  "count": 100,
  "prefix": "GC"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "成功生成 100 张礼品卡",
  "data": {
    "codes": ["GCAB2345", "GCKM6789", "..."],
    "count": 100
  }
}
```

**业务规则**：

- 卡码生成算法：`{prefix}{6位随机字符}`，字符集 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`（去除易混淆字符）
- 过期时间 = 生成时间 + 模板 `validDays` 天
- 初始状态为 `ACTIVE`，`userId` 为空

#### 2.6.2.2 卡码列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/gift-cards` |
| 鉴权 | ADMIN |

**请求参数（Query）**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| status | string | 否 | - | 状态筛选：`ACTIVE` / `USED` / `EXPIRED` |
| templateId | string | 否 | - | 模板 ID 筛选 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "card-uuid",
        "code": "GCAB2345",
        "amount": 10000,
        "status": "ACTIVE",
        "templateId": "tpl-uuid",
        "userId": null,
        "createdAt": "2026-06-28T10:00:00.000Z",
        "expiresAt": "2027-06-28T10:00:00.000Z",
        "usedAt": null,
        "template": { "id": "tpl-uuid", "name": "新春福利套餐" }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2.6.3 礼品卡分类管理

#### 2.6.3.1 分类列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/categories` |
| 鉴权 | ADMIN |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": "cat-uuid",
      "name": "新春",
      "description": "新春福利",
      "icon": "Gift",
      "sort": 0,
      "enabled": true,
      "createdAt": "2026-06-28T10:00:00.000Z",
      "_count": { "templates": 5 }
    }
  ]
}
```

#### 2.6.3.2 创建分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/admin/categories` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| name | string | 是 | - | 分类名称 |
| description | string | 否 | - | 分类描述 |
| icon | string | 否 | `Gift` | 图标 |
| sort | number | 否 | 0 | 排序 |

**请求示例**

```json
{
  "name": "新春",
  "description": "新春福利",
  "icon": "Gift",
  "sort": 0
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": { "id": "cat-uuid", "name": "新春", "icon": "Gift", "sort": 0 }
}
```

#### 2.6.3.3 更新分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/admin/categories/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 分类 ID |

**请求参数（Body，均为可选）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 分类名称 |
| description | string | 分类描述 |
| icon | string | 图标 |
| sort | number | 排序 |
| enabled | boolean | 是否启用 |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": "cat-uuid", "name": "新春", "enabled": false }
}
```

#### 2.6.3.4 删除分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/admin/categories/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 分类 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 2.6.4 礼品卡模板管理

#### 2.6.4.1 模板列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/templates` |
| 鉴权 | ADMIN |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": "tpl-uuid",
      "name": "新春福利套餐",
      "categoryId": "cat-uuid",
      "amount": 10000,
      "validDays": 365,
      "selectCount": 3,
      "maxQuantityPerProduct": 2,
      "createdAt": "2026-06-28T10:00:00.000Z",
      "category": { "id": "cat-uuid", "name": "新春" },
      "products": [
        {
          "id": "tp-uuid",
          "templateId": "tpl-uuid",
          "productId": "prod-uuid",
          "product": { "id": "prod-uuid", "name": "无线耳机", "specs": null }
        }
      ]
    }
  ]
}
```

#### 2.6.4.2 创建模板

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/admin/templates` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 模板名称 |
| categoryId | string | 是 | 礼品卡分类 ID |
| amount | number | 是 | 面额（单位：分） |
| validDays | number | 是 | 有效天数 |
| selectCount | number | 是 | N 选 M 的 M 值 |
| maxQuantityPerProduct | number | 否 | 单品上限（默认 1） |
| productIds | string[] | 是 | 商品池 ID 列表 |

**请求示例**

```json
{
  "name": "新春福利套餐",
  "categoryId": "cat-uuid",
  "amount": 10000,
  "validDays": 365,
  "selectCount": 3,
  "maxQuantityPerProduct": 2,
  "productIds": ["prod-uuid-1", "prod-uuid-2", "prod-uuid-3", "prod-uuid-4", "prod-uuid-5"]
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "tpl-uuid",
    "name": "新春福利套餐",
    "categoryId": "cat-uuid",
    "amount": 10000,
    "validDays": 365,
    "selectCount": 3,
    "maxQuantityPerProduct": 2,
    "products": []
  }
}
```

#### 2.6.4.3 更新模板

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/admin/templates/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 模板 ID |

**请求参数（Body，均为可选）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 模板名称 |
| categoryId | string | 礼品卡分类 ID |
| amount | number | 面额 |
| validDays | number | 有效天数 |
| selectCount | number | N 选 M 的 M 值 |
| maxQuantityPerProduct | number | 单品上限 |
| productIds | string[] | 重新设置商品池（传入则先删除旧关联再重建） |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": "tpl-uuid", "name": "新春福利套餐" }
}
```

> 若传入 `productIds`，系统会先删除该模板的所有 TemplateProduct 关联记录，再按新列表批量重建。

#### 2.6.4.4 删除模板

| 项目 | 说明 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/admin/templates/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 模板 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 2.6.5 商品分类管理

#### 2.6.5.1 商品分类列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/product-categories` |
| 鉴权 | ADMIN |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": "pcat-uuid",
      "name": "数码",
      "parentId": null,
      "icon": "Package",
      "sort": 0,
      "_count": { "products": 12 }
    }
  ]
}
```

#### 2.6.5.2 创建商品分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/admin/product-categories` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| name | string | 是 | - | 分类名称 |
| icon | string | 否 | `Package` | 图标 |
| sort | number | 否 | 0 | 排序 |
| parentId | string | 否 | - | 父分类 ID（支持层级） |

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": { "id": "pcat-uuid", "name": "数码", "icon": "Package", "sort": 0 }
}
```

#### 2.6.5.3 更新商品分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/admin/product-categories/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 商品分类 ID |

**请求参数（Body，均为可选）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 分类名称 |
| icon | string | 图标 |
| sort | number | 排序 |
| parentId | string | 父分类 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": "pcat-uuid", "name": "数码" }
}
```

#### 2.6.5.4 删除商品分类

| 项目 | 说明 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/admin/product-categories/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 商品分类 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 2.6.6 订单管理

#### 2.6.6.1 全部订单列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/orders` |
| 鉴权 | ADMIN |

**请求参数（Query）**

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| status | string | 否 | - | 订单状态筛选 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "order-uuid",
        "orderNo": "ORD20260628123456",
        "status": "PAID",
        "totalAmount": 10000,
        "addressSnapshot": { "name": "张三" },
        "deliveryMethod": { "id": "dm-001", "name": "顺丰快递", "fee": 0 },
        "trackingNumber": null,
        "logisticsCompany": null,
        "createdAt": "2026-06-28T10:00:00.000Z",
        "updatedAt": "2026-06-28T10:00:00.000Z",
        "items": [],
        "user": { "username": "alice", "email": "alice@example.com" },
        "giftCard": {
          "id": "card-uuid",
          "code": "GCAB2345",
          "template": { "id": "tpl-uuid", "name": "新春福利套餐" }
        }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

> 包含全部用户订单，附带下单用户基本信息。

### 2.6.7 物流公司管理

#### 2.6.7.1 物流公司列表

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/admin/logistics` |
| 鉴权 | ADMIN |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": "lc-uuid",
      "name": "顺丰速运",
      "code": "SF",
      "enabled": true
    }
  ]
}
```

> 按公司名升序排序。

#### 2.6.7.2 创建物流公司

| 项目 | 说明 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/admin/logistics` |
| 鉴权 | ADMIN |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 物流公司名称 |
| code | string | 是 | 物流公司编码（UNIQUE） |

**请求示例**

```json
{ "name": "顺丰速运", "code": "SF" }
```

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": { "id": "lc-uuid", "name": "顺丰速运", "code": "SF", "enabled": true }
}
```

#### 2.6.7.3 更新物流公司

| 项目 | 说明 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/admin/logistics/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 物流公司 ID |

**请求参数（Body，均为可选）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 公司名 |
| code | string | 编码 |
| enabled | boolean | 是否启用 |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": "lc-uuid", "name": "顺丰速运", "code": "SF", "enabled": false }
}
```

#### 2.6.7.4 删除物流公司

| 项目 | 说明 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/admin/logistics/:id` |
| 鉴权 | ADMIN |

**请求参数（Path）**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 物流公司 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

## 附：健康检查接口

| 项目 | 说明 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/health` |
| 鉴权 | 公开 |

**请求参数**：无

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": { "status": "running" }
}
```

> 用于负载均衡、容器探针等健康检查场景，确认服务运行状态。
