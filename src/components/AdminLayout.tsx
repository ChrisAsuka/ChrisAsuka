import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Gift, FolderTree, LayoutTemplate, Package,
  ShoppingCart, Truck, LogOut, Menu, X,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/admin", label: "仪表盘", icon: LayoutDashboard },
    { path: "/admin/gift-cards", label: "礼品卡码管理", icon: Gift },
    { path: "/admin/categories", label: "礼品卡分类", icon: FolderTree },
    { path: "/admin/templates", label: "礼品卡模板", icon: LayoutTemplate },
    { path: "/admin/products", label: "商品管理", icon: Package },
    { path: "/admin/orders", label: "订单管理", icon: ShoppingCart },
    { path: "/admin/logistics", label: "物流管理", icon: Truck },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-primary text-white flex-shrink-0 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold">管理后台</span>
          </div>
          <button className="lg:hidden text-white/70" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all",
                isActive(item.path)
                  ? "bg-accent/20 text-accent-light"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user?.username || "管理员"}</p>
              <p className="text-xs text-white/40">管理员</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/60 hover:text-danger hover:bg-white/5 w-full transition-all">
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 遮罩 */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* 主内容 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-surface border-b border-gray-100 h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-primary" />
          </button>
          <h1 className="font-display text-lg font-bold text-primary">
            {menuItems.find((m) => isActive(m.path))?.label || "管理后台"}
          </h1>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
