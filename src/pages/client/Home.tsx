import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Gift, ArrowRight, History, User, Wallet, Sparkles, Tag } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { productApi } from "@/services/api";
import { Button, Card, Loading } from "@/components/ui";
import type { Product } from "@/types";

const quickLinks = [
  { to: "/redeem", label: "礼品卡兑换", desc: "输入卡码立即兑换", icon: Gift },
  { to: "/history", label: "兑换记录", desc: "查看订单状态", icon: History },
  { to: "/profile", label: "个人中心", desc: "管理账户信息", icon: User },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [code, setCode] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .list({ pageSize: 8 })
      .then((res) => setProducts(res.list))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = () => {
    if (!code.trim()) return;
    navigate(`/redeem?code=${encodeURIComponent(code.trim())}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-gradient p-6 md:p-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent-light rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-accent-light text-xs mb-3">
            <Sparkles className="w-3 h-3" /> 尊享礼卡 · 精选好物
          </div>
          <p className="text-white/60 text-sm mb-1">您好，{user?.username || "尊享会员"}</p>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-white mb-2">
            欢迎来到 <span className="gold-text">尊享礼卡</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base mb-6">输入礼品卡码，开启您的专属兑换之旅</p>

          <div className="glass-panel rounded-2xl p-5 inline-flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white/60 text-xs">账户余额</p>
              <p className="text-3xl font-bold gold-text leading-tight">¥{user?.balance ?? 0}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              placeholder="请输入礼品卡码"
              className="flex-1 bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            />
            <Button size="lg" onClick={handleRedeem} disabled={!code.trim()}>
              立即兑换 <ArrowRight className="w-4 h-4 inline ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((q) => (
          <Link key={q.to} to={q.to}>
            <Card hover className="p-5 flex items-center gap-4 h-full">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <q.icon className="w-6 h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary">{q.label}</p>
                <p className="text-xs text-muted truncate">{q.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted ml-auto shrink-0" />
            </Card>
          </Link>
        ))}
      </section>

      {/* Hot products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-primary flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" /> 热门商品
          </h2>
          <Link to="/redeem" className="text-sm text-accent hover:text-accent-dark">去兑换 →</Link>
        </div>
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <Card className="p-8 text-center text-muted">暂无商品</Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <Card key={p.id} hover className="overflow-hidden">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-primary line-clamp-1">{p.name}</p>
                  <p className="text-accent font-bold mt-1">¥{p.price}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
