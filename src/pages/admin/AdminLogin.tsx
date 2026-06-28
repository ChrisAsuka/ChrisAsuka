import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button, Input } from "@/components/ui";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(account, password);
      const { user } = useAuthStore.getState();
      if (user?.role !== "ADMIN") {
        setError("该账号无管理员权限");
        useAuthStore.getState().logout();
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-gradient p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gold-gradient mb-4 shadow-gold-glow">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold gold-text">管理后台</h1>
          <p className="text-white/50 text-sm mt-1">管理员登录</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="管理员账号" placeholder="请输入账号" value={account} onChange={(e) => setAccount(e.target.value)} required />
            <Input label="密码" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error && <p className="text-sm text-danger bg-danger/5 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
              {!loading && <ArrowRight className="w-4 h-4 inline ml-1" />}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="text-xs text-muted hover:text-accent transition-colors">
              ← 返回用户登录
            </Link>
          </div>

          <div className="mt-4 text-xs text-muted bg-gray-50 rounded-lg p-3">
            <p>管理员账号：admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
