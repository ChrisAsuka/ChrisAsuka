import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi, productApi } from "@/services/api";
import type { GiftCardTemplate, GiftCardCategory, Product } from "@/types";
import { Button, Card, Badge, Modal, Input, Select, Loading, Empty } from "@/components/ui";

interface FormState {
  name: string;
  categoryId: string;
  amount: number;
  validDays: number;
  selectCount: number;
  maxQuantityPerProduct: number;
  productIds: string[];
}

const emptyForm: FormState = {
  name: "",
  categoryId: "",
  amount: 0,
  validDays: 365,
  selectCount: 1,
  maxQuantityPerProduct: 1,
  productIds: [],
};

export default function Templates() {
  const [list, setList] = useState<(GiftCardTemplate & { category?: GiftCardCategory; products?: { product: Product }[] })[]>([]);
  const [categories, setCategories] = useState<GiftCardCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCardTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cs, ts] = await Promise.all([adminApi.listCategories(), adminApi.listTemplates()]);
      setCategories(cs);
      setList(ts);
    } catch (e) {
      alert(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productApi.list({ pageSize: 100 });
      setProducts(res.list);
    } catch {
      /* ignore */
    }
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
    await loadProducts();
  };

  const openEdit = async (t: GiftCardTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      categoryId: t.categoryId,
      amount: t.amount,
      validDays: t.validDays,
      selectCount: t.selectCount,
      maxQuantityPerProduct: t.maxQuantityPerProduct,
      productIds: t.products?.map((p) => p.product.id) || [],
    });
    setModalOpen(true);
    await loadProducts();
  };

  const toggleProduct = (id: string) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) {
      alert("请填写完整信息");
      return;
    }
    setSaving(true);
    try {
      if (editing) await adminApi.updateTemplate(editing.id, { ...form });
      else await adminApi.createTemplate(form);
      setModalOpen(false);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteTemplate(deleteId);
      setDeleteId(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4 inline mr-1" />新增模板</Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无模板" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">分类</th>
                <th className="px-4 py-3">面额</th>
                <th className="px-4 py-3">有效期</th>
                <th className="px-4 py-3">N选M</th>
                <th className="px-4 py-3">关联商品</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 text-sm">
                  <td className="px-4 py-3 font-medium text-primary">{t.name}</td>
                  <td className="px-4 py-3">{t.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-accent font-semibold">¥{t.amount}</td>
                  <td className="px-4 py-3">{t.validDays} 天</td>
                  <td className="px-4 py-3"><Badge color="gold">选 {t.selectCount}</Badge></td>
                  <td className="px-4 py-3">{t.products?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)}><Trash2 className="w-4 h-4 text-danger" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑模板" : "新增模板"} className="max-w-2xl">
        <div className="space-y-4">
          <Input label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="分类" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="面额（¥）" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <Input label="有效期（天）" type="number" value={form.validDays} onChange={(e) => setForm({ ...form, validDays: Number(e.target.value) })} />
            <Input label="选择数量 M" type="number" value={form.selectCount} onChange={(e) => setForm({ ...form, selectCount: Number(e.target.value) })} />
            <Input label="每件上限" type="number" value={form.maxQuantityPerProduct} onChange={(e) => setForm({ ...form, maxQuantityPerProduct: Number(e.target.value) })} />
          </div>
          <div>
            <p className="block text-sm font-medium text-primary mb-2">关联商品（多选）</p>
            <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-2 space-y-1">
              {products.length === 0 ? (
                <p className="text-sm text-muted p-2">暂无商品</p>
              ) : (
                products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-accent" />
                    <span className="text-sm text-primary">{p.name}</span>
                    <span className="text-xs text-muted ml-auto">¥{p.price}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted mt-1">已选 {form.productIds.length} 件</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="删除确认">
        <p className="text-sm text-muted mb-4">确定要删除此模板吗？</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>
    </div>
  );
}
