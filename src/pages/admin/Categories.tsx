import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi } from "@/services/api";
import type { GiftCardCategory } from "@/types";
import { Button, Card, Badge, Modal, Input, Textarea, Loading, Empty } from "@/components/ui";

interface FormState {
  name: string;
  description: string;
  icon: string;
  sort: number;
  enabled: boolean;
}

const emptyForm: FormState = { name: "", description: "", icon: "Gift", sort: 0, enabled: true };

export default function Categories() {
  const [list, setList] = useState<GiftCardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCardCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setList(await adminApi.listCategories());
    } catch (e) {
      alert(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: GiftCardCategory) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", icon: c.icon, sort: c.sort, enabled: c.enabled });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("请输入名称");
      return;
    }
    setSaving(true);
    try {
      if (editing) await adminApi.updateCategory(editing.id, form);
      else await adminApi.createCategory(form);
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
      await adminApi.deleteCategory(deleteId);
      setDeleteId(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4 inline mr-1" />新增分类</Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无分类" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">描述</th>
                <th className="px-4 py-3">图标</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">模板数</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 text-sm">
                  <td className="px-4 py-3 font-medium text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.description || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.icon}</td>
                  <td className="px-4 py-3">{c.sort}</td>
                  <td className="px-4 py-3">{c.enabled ? <Badge color="success">启用</Badge> : <Badge color="danger">禁用</Badge>}</td>
                  <td className="px-4 py-3">{c._count?.templates ?? 0}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}><Trash2 className="w-4 h-4 text-danger" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑分类" : "新增分类"}>
        <div className="space-y-4">
          <Input label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入分类名称" />
          <Textarea label="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="分类描述" />
          <Input label="图标（lucide 图标名）" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="如 Gift" />
          <Input label="排序" type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="w-4 h-4 accent-accent" />
            启用
          </label>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="删除确认">
        <p className="text-sm text-muted mb-4">确定要删除此分类吗？此操作不可恢复。</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>
    </div>
  );
}
