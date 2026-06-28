import { Link, useNavigate } from "react-router-dom";
import { Mail, Wallet, Gift, History, LogOut, Calendar, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button, Card } from "@/components/ui";

const actions = [
  { to: "/redeem", label: "礼品卡兑换", desc: "输入卡码兑换好物", icon: Gift },
  { to: "/history", label: "订单历史", desc: "查看兑换记录", icon: History },
];

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.username || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* User info card */}
      <Card className="overflow-hidden">
        <div className="bg-navy-gradient p-6 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-3xl font-bold text-primary shadow-gold-glow shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-white truncate">{user?.username || "用户"}</h1>
              <p className="text-white/60 text-sm flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{user?.email || "—"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">账户余额</p>
              <p className="text-xl font-bold text-accent">¥{user?.balance ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">注册时间</p>
              <p className="text-sm font-medium text-primary truncate">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-primary">快捷操作</h2>
        {actions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card hover className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <a.icon className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">{a.label}</p>
                <p className="text-xs text-muted">{a.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted shrink-0" />
            </Card>
          </Link>
        ))}
      </section>

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="w-4 h-4 inline mr-1" /> 退出登录
      </Button>
    </div>
  );
}
