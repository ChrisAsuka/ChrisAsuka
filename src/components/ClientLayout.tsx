import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Gift, Home, User, History, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/redeem", label: "兑换", icon: Gift },
    { path: "/history", label: "订单", icon: History },
    { path: "/profile", label: "我的", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-md border-b border-accent/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold gold-text">尊享礼卡</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      active ? "bg-accent/20 text-accent-light" : "text-white/70 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                    <span className="text-accent-light text-sm font-medium">¥{user.balance}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-gold !py-1.5 !px-4 text-sm">登录</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-6 pb-20 md:pb-6">{children}</main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5", active ? "text-accent" : "text-muted")}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
