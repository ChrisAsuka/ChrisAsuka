import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { adminApi } from "@/services/api";
import type { LogisticsCompany } from "@/types";
import { Button, Card, Badge, Modal, Input, Loading, Empty } from "@/components/ui";

interface FormState {
  name: string;
  code: string;
}

const emptyForm: FormState = { name: "", code: "" };

export default function Logistics() {
  const [list, setList] = useState<LogisticsCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LogisticsCompany | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setList(await adminApi.listLogistics());
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

  const openEdit = (l: LogisticsCompany) => {
    setEditing(l);
    setForm({ name: l.name, code: l.code });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      alert("请填写完整信息");
      return;
    }
    setSaving(true);
    try {
      if (editing) await adminApi.updateLogistics(editing.id, form);
      else await adminApi.createLogistics(form);
      setModalOpen(false);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (l: LogisticsCompany) => {
    try {
      await adminApi.updateLogistics(l.id, { enabled: !l.enabled });
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteLogistics(deleteId);
      setDeleteId(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4 inline mr-1" />新增物流公司</Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无物流公司" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">编码</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 text-sm">
                  <td className="px-4 py-3 font-medium text-primary">{l.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                  <td className="px-4 py-3">{l.enabled ? <Badge color="success">启用</Badge> : <Badge color="danger">禁用</Badge>}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(l)} title="启用/禁用"><Power className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(l.id)}><Trash2 className="w-4 h-4 text-danger" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑物流公司" : "新增物流公司"}>
        <div className="space-y-4">
          <Input label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：顺丰速运" />
          <Input label="编码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如：SF" />
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="删除确认">
        <p className="text-sm text-muted mb-4">确定要删除此物流公司吗？</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>
    </div>
  );
}
