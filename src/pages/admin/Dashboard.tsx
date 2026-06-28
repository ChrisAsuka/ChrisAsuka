import { useEffect, useState } from "react";
import { ShoppingCart, Clock, Coins, Gift, Package, AlertTriangle } from "lucide-react";
import { adminApi, type DashboardData } from "@/services/api";
import { Card, Loading } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((e) => alert(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="加载统计中..." />;
  if (!data) return null;

  const mainStats = [
    { label: "今日订单", value: data.todayOrders, icon: ShoppingCart },
    { label: "待处理订单", value: data.pendingOrders, icon: Clock },
    { label: "总销售额", value: `¥${data.totalAmount}`, icon: Coins },
    { label: "礼品卡总数", value: data.cardCount, icon: Gift },
  ];

  const subStats = [
    { label: "商品总数", value: data.productCount, icon: Package, highlight: false },
    { label: "库存预警", value: data.lowStock, icon: AlertTriangle, highlight: data.lowStock > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">欢迎回来，管理员 👋</h2>
        <p className="text-sm text-muted mt-1">这里是您的礼品卡兑换系统概览</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((s) => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{s.label}</p>
                <p className="text-3xl font-display font-bold text-primary mt-2">{s.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <s.icon className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subStats.map((s) => (
          <Card key={s.label} className="p-6 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.highlight ? "bg-danger/10" : "bg-accent/10")}>
              <s.icon className={cn("w-6 h-6", s.highlight ? "text-danger" : "text-accent")} />
            </div>
            <div>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="text-2xl font-display font-bold text-primary">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
