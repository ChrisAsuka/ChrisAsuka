import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Gift, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ account: "", username: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.account, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      const { user } = useAuthStore.getState();
      navigate(user?.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-gradient p-4 relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-gradient mb-4 shadow-gold-glow">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold gold-text">尊享礼卡</h1>
          <p className="text-white/50 text-sm mt-2">礼品卡兑换平台</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl p-8">
          {/* 模式切换 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", mode === m ? "bg-surface shadow text-primary" : "text-muted")}
              >
                {m === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "login" ? (
              <Input
                label="账号"
                placeholder="用户名或邮箱"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                required
              />
            ) : (
              <>
                <Input label="用户名" placeholder="请输入用户名" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                <Input label="邮箱" type="email" placeholder="请输入邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </>
            )}
            <Input label="密码" type="password" placeholder="请输入密码" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

            {error && <p className="text-sm text-danger bg-danger/5 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
              {!loading && <ArrowRight className="w-4 h-4 inline ml-1" />}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/admin/login" className="text-xs text-muted hover:text-accent transition-colors">
              管理员登录 →
            </Link>
          </div>

          <div className="mt-4 text-xs text-muted bg-gray-50 rounded-lg p-3 space-y-1">
            <p>测试账号：</p>
            <p>用户：member / user123</p>
            <p>管理员：admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
