import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { adminApi, productApi } from "@/services/api";
import type { Product, ProductCategory } from "@/types";
import { Button, Card, Badge, Modal, Input, Textarea, Select, Loading, Empty } from "@/components/ui";

interface FormState {
  name: string;
  categoryId: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  specs: string;
}

const emptyForm: FormState = { name: "", categoryId: "", description: "", image: "", price: 0, stock: 0, specs: "" };

export default function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        productApi.categories(),
        productApi.list({ categoryId: filterCat || undefined, pageSize: 100 }),
      ]);
      setCategories(cs);
      setList(ps.list);
    } catch (e) {
      alert(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCat]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      description: p.description,
      image: p.image,
      price: p.price,
      stock: p.stock,
      specs: typeof p.specs === "string" ? p.specs : JSON.stringify(p.specs || ""),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) {
      alert("请填写完整信息");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, specs: form.specs ? JSON.parse(form.specs) : null };
      if (editing) await adminApi.updateProduct(editing.id, payload);
      else await adminApi.createProduct(payload);
      setModalOpen(false);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await adminApi.updateProduct(p.id, { status: p.status === "ON" ? "OFF" : "ON" });
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteProduct(deleteId);
      setDeleteId(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-48">
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button onClick={openCreate}><Plus className="w-4 h-4 inline mr-1" />新增商品</Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无商品" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">分类</th>
                <th className="px-4 py-3">价格</th>
                <th className="px-4 py-3">库存</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      <span className="font-medium text-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-accent font-semibold">¥{p.price}</td>
                  <td className="px-4 py-3">
                    {p.stock < 20 ? <span className="text-danger font-semibold">{p.stock}</span> : p.stock}
                  </td>
                  <td className="px-4 py-3">{p.status === "ON" ? <Badge color="success">上架</Badge> : <Badge color="danger">下架</Badge>}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(p)} title="上下架"><Power className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 text-danger" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑商品" : "新增商品"} className="max-w-2xl">
        <div className="space-y-4">
          <Input label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="分类" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Textarea label="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="图片 URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="价格（¥）" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="库存" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <Input label="规格（JSON）" value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} placeholder='如 {"颜色":"红"}' />
          {form.image && <img src={form.image} alt="预览" className="w-20 h-20 rounded-lg object-cover" />}
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="删除确认">
        <p className="text-sm text-muted mb-4">确定要删除此商品吗？</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>
    </div>
  );
}
