import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Gift, Check, Package, Truck, MapPin, ShieldCheck, AlertCircle, PartyPopper } from "lucide-react";
import { giftCardApi, type GiftCardValidateResult } from "@/services/api";
import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const STEPS = [
  { n: 1, label: "验证", icon: ShieldCheck },
  { n: 2, label: "选品", icon: Package },
  { n: 3, label: "配送", icon: Truck },
  { n: 4, label: "确认", icon: Check },
];

const DELIVERY_METHODS = [
  { id: "standard", name: "标准配送", description: "3-5个工作日送达", fee: 0, estimatedDays: "3-5天" },
  { id: "express", name: "加急配送", description: "1-2个工作日送达", fee: 15, estimatedDays: "1-2天" },
  { id: "premium", name: "尊享配送", description: "当日达，专人配送", fee: 30, estimatedDays: "当日" },
];

type Address = { name: string; phone: string; province: string; city: string; district: string; detail: string };
const EMPTY_ADDR: Address = { name: "", phone: "", province: "", city: "", district: "", detail: "" };

export default function Redeem() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState(params.get("code") || "");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GiftCardValidateResult | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [address, setAddress] = useState<Address>(EMPTY_ADDR);
  const [delivery, setDelivery] = useState(DELIVERY_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const selectCount = result?.template.selectCount ?? 0;
  const maxPer = result?.template.maxQuantityPerProduct ?? 1;
  const selectedCount = Object.keys(selected).length;

  const handleValidate = async () => {
    setError("");
    if (!code.trim()) { setError("请输入礼品卡码"); return; }
    setValidating(true);
    try {
      const res = await giftCardApi.validate(code.trim());
      setResult(res);
      setSelected({});
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setValidating(false);
    }
  };

  const toggleProduct = (pid: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (pid in next) delete next[pid];
      else if (Object.keys(next).length < selectCount) next[pid] = 1;
      return next;
    });
  };

  const setQty = (pid: string, qty: number) => {
    setSelected((prev) => ({ ...prev, [pid]: Math.max(1, Math.min(qty, maxPer)) }));
  };

  const addrValid = !!(address.name && address.phone && address.province && address.city && address.district && address.detail);

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const items = Object.entries(selected).map(([productId, quantity]) => ({ productId, quantity }));
      const res = await giftCardApi.redeem({ code: code.trim(), items, address, deliveryMethod: { id: delivery.id, name: delivery.name, fee: delivery.fee } });
      setOrder(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "兑换失败");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCode(""); setResult(null); setSelected({});
    setAddress(EMPTY_ADDR); setDelivery(DELIVERY_METHODS[0]);
    setOrder(null); setStep(1); setError("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", step >= s.n ? "bg-gold-gradient text-primary" : "bg-gray-100 text-muted")}>
                  {step > s.n ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className={cn("text-xs font-medium", step >= s.n ? "text-primary" : "text-muted")}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 mx-2 rounded transition-all", step > s.n ? "bg-accent" : "bg-gray-200")} />}
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Step 1: validate */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-gradient mb-3 shadow-gold-glow">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-primary">礼品卡验证</h2>
            <p className="text-sm text-muted mt-1">输入您的礼品卡码，开始兑换流程</p>
          </div>
          <Input label="礼品卡码" placeholder="请输入礼品卡码" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleValidate()} />
          <Button className="w-full" onClick={handleValidate} disabled={validating}>{validating ? "验证中..." : "验证礼品卡"}</Button>
        </Card>
      )}

      {/* Step 2: select products (N选M) */}
      {step === 2 && result && (
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-primary truncate">{result.template.name}</h2>
              <p className="text-sm text-muted">面额 ¥{result.amount} · {result.template.categoryName}</p>
              <p className="text-xs text-muted mt-0.5">有效期至 {new Date(result.expiresAt).toLocaleDateString("zh-CN")}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-accent leading-none">{selectedCount}/{selectCount}</p>
              <p className="text-xs text-muted mt-1">已选商品</p>
            </div>
          </div>

          <div className="bg-accent/5 rounded-xl px-4 py-2.5 text-sm text-primary">
            请选择 <span className="font-bold text-accent">{selectCount}</span> 件商品（共可选 {result.products.length} 件，每件最多 {maxPer} 个）
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {result.products.map((p) => {
              const qty = selected[p.id];
              const isSel = !!qty;
              return (
                <div key={p.id} onClick={() => toggleProduct(p.id)}
                  className={cn("relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all", isSel ? "border-accent shadow-gold-glow" : "border-transparent hover:border-gray-200 bg-surface")}>
                  <div className="aspect-square bg-gray-50"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>
                  {isSel && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gold-gradient flex items-center justify-center"><Check className="w-3 h-3 text-primary" /></div>}
                  <div className="p-2">
                    <p className="text-xs font-medium text-primary line-clamp-1">{p.name}</p>
                    <p className="text-xs text-accent">¥{p.price}</p>
                    {isSel && maxPer > 1 && (
                      <div className="flex items-center justify-between mt-1.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setQty(p.id, qty - 1)} className="w-6 h-6 rounded bg-gray-100 text-primary leading-none">-</button>
                        <span className="text-sm font-bold text-primary">{qty}</span>
                        <button onClick={() => setQty(p.id, qty + 1)} disabled={qty >= maxPer} className="w-6 h-6 rounded bg-gray-100 text-primary leading-none disabled:opacity-40">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => { setStep(1); setError(""); }}>← 上一步</Button>
            <Button onClick={() => { setError(""); setStep(3); }} disabled={selectedCount !== selectCount}>
              {selectedCount !== selectCount ? `还需选择 ${selectCount - selectedCount} 件` : "下一步"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: delivery */}
      {step === 3 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2"><MapPin className="w-5 h-5 text-accent" /> 配送信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="收货人" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="请输入姓名" />
            <Input label="手机号" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="请输入手机号" />
            <Input label="省份" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} placeholder="省" />
            <Input label="城市" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="市" />
            <Input label="区/县" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} placeholder="区/县" />
            <Input label="详细地址" value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder="街道门牌号" />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-primary mb-2">配送方式</p>
            <div className="space-y-2">
              {DELIVERY_METHODS.map((m) => (
                <button key={m.id} onClick={() => setDelivery(m)}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left", delivery.id === m.id ? "border-accent bg-accent/5" : "border-gray-200 hover:border-gray-300")}>
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", delivery.id === m.id ? "border-accent" : "border-gray-300")}>
                    {delivery.id === m.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <Truck className="w-5 h-5 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">{m.name}</p>
                    <p className="text-xs text-muted">{m.description} · 预计{m.estimatedDays}</p>
                  </div>
                  <span className="text-sm font-bold text-accent shrink-0">{m.fee === 0 ? "免费" : `¥${m.fee}`}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => { setStep(2); setError(""); }}>← 上一步</Button>
            <Button onClick={() => { setError(""); setStep(4); }} disabled={!addrValid}>下一步</Button>
          </div>
        </Card>
      )}

      {/* Step 4: confirm */}
      {step === 4 && !order && result && (
        <Card className="p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2"><Check className="w-5 h-5 text-accent" /> 确认兑换</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-muted mb-1">礼品卡</p>
              <p className="text-sm font-medium text-primary">{result.template.name} · ¥{result.amount}</p>
              <p className="text-xs text-muted">卡码：{result.code}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-muted mb-2">已选商品</p>
              <div className="space-y-2">
                {Object.entries(selected).map(([pid, qty]) => {
                  const p = result.products.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="flex items-center gap-2">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <p className="text-sm text-primary flex-1 truncate">{p.name}</p>
                      <span className="text-xs text-muted shrink-0">x{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-muted mb-1">收货地址</p>
              <p className="text-sm text-primary">{address.name} {address.phone}</p>
              <p className="text-xs text-muted">{address.province}{address.city}{address.district}{address.detail}</p>
              <p className="text-xs text-muted mt-1">配送：{delivery.name}（{delivery.fee === 0 ? "免费" : `¥${delivery.fee}`}）</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => { setStep(3); setError(""); }}>← 上一步</Button>
            <Button onClick={handleConfirm} disabled={submitting}>{submitting ? "兑换中..." : "确认兑换"}</Button>
          </div>
        </Card>
      )}

      {/* Success */}
      {step === 4 && order && (
        <Card className="p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-2">
            <PartyPopper className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary">兑换成功！</h2>
          <p className="text-sm text-muted">您的订单已生成，我们将尽快为您安排配送</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto">
            <p className="text-xs text-muted">订单号</p>
            <p className="text-sm font-medium text-primary break-all">{order.orderNo}</p>
            <p className="text-xs text-muted mt-2">订单金额</p>
            <p className="text-lg font-bold text-accent">¥{order.totalAmount}</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={reset}>再兑换一张</Button>
            <Button onClick={() => navigate("/history")}>查看订单</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
