import { useEffect, useState } from "react";
import { Plus, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/services/api";
import type { GiftCard, GiftCardTemplate } from "@/types";
import { Button, Card, Badge, Modal, Input, Select, Loading, Empty, cardStatusMap } from "@/components/ui";

const PAGE_SIZE = 10;

export default function GiftCards() {
  const [list, setList] = useState<(GiftCard & { template?: GiftCardTemplate })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ templateId: "", count: 1, prefix: "" });
  const [genLoading, setGenLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listCards({ status: status || undefined, page, pageSize: PAGE_SIZE });
      setList(res.list);
      setTotal(res.total);
    } catch (e) {
      alert(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminApi.listTemplates().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCards();
  }, [page, status]);

  const handleGenerate = async () => {
    if (!genForm.templateId) {
      alert("请选择模板");
      return;
    }
    setGenLoading(true);
    try {
      const res = await adminApi.generateCards({
        templateId: genForm.templateId,
        count: Number(genForm.count),
        prefix: genForm.prefix || undefined,
      });
      setGeneratedCodes(res.codes);
      fetchCards();
    } catch (e) {
      alert(e instanceof Error ? e.message : "生成失败");
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCodes) return;
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">全部状态</option>
          <option value="ACTIVE">未使用</option>
          <option value="USED">已使用</option>
          <option value="EXPIRED">已过期</option>
        </Select>
        <Button onClick={() => { setGenOpen(true); setGeneratedCodes(null); }}>
          <Plus className="w-4 h-4 inline mr-1" />批量生成
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="暂无礼品卡" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-muted">
                <th className="px-4 py-3">卡码</th>
                <th className="px-4 py-3">面额</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">模板</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3">过期时间</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const st = cardStatusMap[c.status];
                return (
                  <tr key={c.id} className="border-b border-gray-100 text-sm">
                    <td className="px-4 py-3 font-mono text-primary">{c.code}</td>
                    <td className="px-4 py-3">¥{c.amount}</td>
                    <td className="px-4 py-3">{st && <Badge color={st.color}>{st.label}</Badge>}</td>
                    <td className="px-4 py-3">{c.template?.name || "-"}</td>
                    <td className="px-4 py-3 text-muted">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted">{new Date(c.expiresAt).toLocaleDateString()}</td>
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

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="批量生成礼品卡">
        {generatedCodes ? (
          <div className="space-y-3">
            <p className="text-sm text-success">成功生成 {generatedCodes.length} 张礼品卡 🎉</p>
            <textarea
              readOnly
              value={generatedCodes.join("\n")}
              className="w-full h-40 bg-gray-50 rounded-xl p-3 font-mono text-xs border-2 border-gray-200"
            />
            <Button onClick={handleCopy} variant="outline" className="w-full">
              {copied ? <><Check className="w-4 h-4 inline mr-1" />已复制</> : <><Copy className="w-4 h-4 inline mr-1" />复制全部</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Select label="选择模板" value={genForm.templateId} onChange={(e) => setGenForm({ ...genForm, templateId: e.target.value })}>
              <option value="">请选择模板</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}（¥{t.amount}）</option>
              ))}
            </Select>
            <Input
              label="生成数量"
              type="number"
              min={1}
              max={100}
              value={genForm.count}
              onChange={(e) => setGenForm({ ...genForm, count: Number(e.target.value) })}
            />
            <Input
              label="卡码前缀（可选）"
              placeholder="如 GC"
              value={genForm.prefix}
              onChange={(e) => setGenForm({ ...genForm, prefix: e.target.value })}
            />
            <Button onClick={handleGenerate} disabled={genLoading} className="w-full">
              {genLoading ? "生成中..." : "确认生成"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
