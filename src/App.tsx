import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import ClientLayout from "@/components/ClientLayout";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/admin/AdminLogin";
import Home from "@/pages/client/Home";
import Redeem from "@/pages/client/Redeem";
import Profile from "@/pages/client/Profile";
import History from "@/pages/client/History";
import Dashboard from "@/pages/admin/Dashboard";
import GiftCards from "@/pages/admin/GiftCards";
import Categories from "@/pages/admin/Categories";
import Templates from "@/pages/admin/Templates";
import Products from "@/pages/admin/Products";
import Orders from "@/pages/admin/Orders";
import Logistics from "@/pages/admin/Logistics";

function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, fetchProfile } = useAuthStore();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && !user) fetchProfile();
  }, [token, user, fetchProfile]);

  if (!token) return <Navigate to={admin ? "/admin/login" : "/login"} replace />;
  if (admin && user && user.role !== "ADMIN") return <Navigate to="/admin/login" replace />;
  if (admin && !user) return <div className="min-h-screen flex items-center justify-center text-muted">加载中...</div>;
  return <>{children}</>;
}

export default function App() {
  const { fetchProfile } = useAuthStore();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) fetchProfile();
  }, [fetchProfile, token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* C端 */}
        <Route path="/" element={<ProtectedRoute><ClientLayout><Home /></ClientLayout></ProtectedRoute>} />
        <Route path="/redeem" element={<ProtectedRoute><ClientLayout><Redeem /></ClientLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ClientLayout><Profile /></ClientLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><ClientLayout><History /></ClientLayout></ProtectedRoute>} />

        {/* B端管理后台 */}
        <Route path="/admin" element={<ProtectedRoute admin><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/gift-cards" element={<ProtectedRoute admin><AdminLayout><GiftCards /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute admin><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute admin><AdminLayout><Templates /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute admin><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute admin><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/logistics" element={<ProtectedRoute admin><AdminLayout><Logistics /></AdminLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
