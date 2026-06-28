import { useState, useEffect } from "react";
import { Receipt, Package } from "lucide-react";
import { orderApi } from "@/services/api";
import { Card, Badge, Loading, Empty, orderStatusMap } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const TABS: { label: string; value?: string }[] = [
  { label: "全部" },
  { label: "待发货", value: "PAID" },
  { label: "已发货", value: "SHIPPING" },
  { label: "已收货", value: "DELIVERED" },
  { label: "已完成", value: "COMPLETED" },
];

export default function History() {
  const [active, setActive] = useState<string | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderApi
      .list({ status: active, pageSize: 20 })
      .then((res) => setOrders(res.list))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Receipt className="w-6 h-6 text-accent" />
        <h1 className="font-display text-2xl font-bold text-primary">订单历史</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setActive(t.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              active === t.value ? "bg-gold-gradient text-primary shadow-gold-glow" : "bg-surface text-muted hover:text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <Empty text="暂无订单记录" />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const status = orderStatusMap[o.status] || { label: o.status, color: "info" as const };
            const items = o.items || [];
            return (
              <Card key={o.id} hover className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">订单号：{o.orderNo}</p>
                    <p className="text-xs text-muted mt-0.5">{new Date(o.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                  <Badge color={status.color}>{status.label}</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {items.slice(0, 3).map((it) => (
                      <div key={it.id} className="w-12 h-12 rounded-lg bg-gray-50 border-2 border-surface overflow-hidden shrink-0">
                        <img src={it.productImage} alt={it.productName} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border-2 border-surface flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted">
                      共 {items.length} 件商品
                      {items.length > 0 && ` · ${items[0].productName}${items.length > 1 ? " 等" : ""}`}
                    </p>
                    {o.trackingNumber && (
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {o.logisticsCompany || "物流"}：{o.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted">总金额</p>
                    <p className="text-lg font-bold text-accent">¥{o.totalAmount}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
