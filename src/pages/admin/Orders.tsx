import { useEffect, useState } from "react";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/services/api";
import type { Order, OrderStatus, LogisticsCompany } from "@/types";
import { Button, Card, Badge, Modal, Select, Input, Loading, Empty, orderStatusMap } from "@/components/ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "全部", value: "" },
  { label: "待发货", value: "PAID" },
  { label: "已发货", value: "SHIPPING" },
  { label: "已收货", value: "DELIVERED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "退款中", value: "REFUNDING" },
];

export default function Orders() {
  const [list, setList] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [logistics, setLogistics] = useState<LogisticsCompany[]>([]);

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<{ status: OrderStatus | ""; trackingNumber: string; logisticsCompany: string }>({
    status: "",
    trackingNumber: "",
    logisticsCompany: "",
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listAllOrders({ status: status || undefined, page, pageSize: PAGE_SIZE });
      setList(res.list);
      setTotal(res.total);
    } catch (e) {
      alert(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminApi.listLogistics().then(setLogistics).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [page, status]);

  const openEdit = (o: Order) => {
    setEditOrder(o);
    setEditForm({ status: o.status, trackingNumber: o.trackingNumber || "", logisticsCompany: o.logisticsCompany || "" });
  };

  const handleSave = async () => {
    if (!editOrder || !editForm.status) return;
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(editOrder.id, {
        status: editForm.status as OrderStatus,
        trackingNumber: editForm.trackingNumber || undefined,
        logisticsCompany: editForm.logisticsCompany || undefined,
      });
      setEditOrder(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              status === t.value ? "bg-accent text-primary font-semibold" : "bg-surface text-muted hover:bg-gray-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无订单" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">商品数</th>
                <th className="px-4 py-3">总金额</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">物流单号</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => {
                const st = orderStatusMap[o.status];
                const itemCount = o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                return (
                  <tr key={o.id} className="border-b border-gray-100 text-sm">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{o.orderNo}</td>
                    <td className="px-4 py-3">{o.user?.username || "-"}</td>
                    <td className="px-4 py-3">{itemCount}</td>
                    <td className="px-4 py-3 text-accent font-semibold">¥{o.totalAmount}</td>
                    <td className="px-4 py-3">{st && <Badge color={st.color}>{st.label}</Badge>}</td>
                    <td className="px-4 py-3 text-muted text-xs">{o.trackingNumber || "-"}</td>
                    <td className="px-4 py-3 text-muted text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(o)}><Pencil className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />上一页
            </Button>
            <span className="px-3 py-1.5 text-muted">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal open={!!editOrder} onClose={() => setEditOrder(null)} title="更新订单状态">
        <div className="space-y-4">
          <Select label="状态" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as OrderStatus })}>
            {Object.entries(orderStatusMap).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <Input
            label="物流单号"
            value={editForm.trackingNumber}
            onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
            placeholder="请输入物流单号"
          />
          <Select label="物流公司" value={editForm.logisticsCompany} onChange={(e) => setEditForm({ ...editForm, logisticsCompany: e.target.value })}>
            <option value="">请选择物流公司</option>
            {logistics.map((l) => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </Select>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </Modal>
    </div>
  );
}
