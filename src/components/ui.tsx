import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

// ========== Button ==========
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "gold", size = "md", className, children, ...props }: ButtonProps) {
  const variants = {
    gold: "bg-gold-gradient text-primary font-semibold hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]",
    outline: "border-2 border-accent text-accent hover:bg-accent hover:text-primary",
    ghost: "text-primary hover:bg-gray-100",
    danger: "bg-danger text-white hover:bg-red-600",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5", lg: "px-6 py-3 text-lg" };
  return (
    <button
      className={cn("rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ========== Card ==========
export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("bg-surface rounded-2xl shadow-card", hover && "hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300", className)}>{children}</div>;
}

// ========== Badge ==========
const badgeColors: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-primary/10 text-primary",
  gold: "bg-accent/10 text-accent-dark",
};

export function Badge({ children, color = "info", className }: { children: ReactNode; color?: keyof typeof badgeColors; className?: string }) {
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", badgeColors[color], className)}>{children}</span>;
}

// ========== Modal ==========
export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto", className)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-display font-bold text-primary">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-muted" /></button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ========== Input ==========
export function Input({ label, error, className, ...props }: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-primary">{label}</label>}
      <input className={cn("w-full bg-surface border-2 border-gray-200 rounded-xl px-4 py-2.5 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all", error && "border-danger", className)} {...props} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-primary">{label}</label>}
      <textarea className={cn("w-full bg-surface border-2 border-gray-200 rounded-xl px-4 py-2.5 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all min-h-[80px]", error && "border-danger", className)} {...props} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, children, ...props }: { label?: string; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-primary">{label}</label>}
      <select className={cn("w-full bg-surface border-2 border-gray-200 rounded-xl px-4 py-2.5 text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all", error && "border-danger", className)} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ========== Loading ==========
export function Loading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
      {text}
    </div>
  );
}

export function Empty({ text = "暂无数据" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ========== 订单状态映射 ==========
export const orderStatusMap: Record<string, { label: string; color: "success" | "warning" | "danger" | "info" | "gold" }> = {
  PAID: { label: "待发货", color: "gold" },
  SHIPPING: { label: "已发货", color: "info" },
  DELIVERING: { label: "配送中", color: "info" },
  DELIVERED: { label: "已收货", color: "success" },
  COMPLETED: { label: "已完成", color: "success" },
  REFUNDING: { label: "退款中", color: "warning" },
  REFUNDED: { label: "已退款", color: "danger" },
  RETURNING: { label: "退货中", color: "warning" },
  RETURNED: { label: "已退货", color: "danger" },
};

export const cardStatusMap: Record<string, { label: string; color: "success" | "warning" | "danger" }> = {
  ACTIVE: { label: "未使用", color: "success" },
  USED: { label: "已使用", color: "warning" },
  EXPIRED: { label: "已过期", color: "danger" },
};
