"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { updatePricingRuleAction } from "@/app/admin/(protected)/pricing/actions";
import { formatAdminCurrency } from "@/lib/admin/format";
import { toPsychologicalPrice } from "@/lib/pricing";

export function PricingRuleEditor({
  id,
  expectedUpdatedAt,
  baseCost: initialBaseCost,
  override: initialOverride,
  margin,
  psychological,
}: {
  id: string;
  expectedUpdatedAt: string;
  baseCost: number;
  override: number | null;
  margin: number;
  psychological: boolean;
}) {
  const [baseCost, setBaseCost] = useState(initialBaseCost);
  const [override, setOverride] = useState(initialOverride == null ? "" : String(initialOverride));
  const preview = useMemo(() => {
    const raw = baseCost + margin;
    const calculated = psychological ? toPsychologicalPrice(raw) : raw;
    const parsedOverride = override === "" ? null : Number(override);
    const final = parsedOverride != null && Number.isFinite(parsedOverride) ? parsedOverride : calculated;
    return { raw, calculated, final, profit: final - baseCost, belowCost: final < baseCost };
  }, [baseCost, margin, override, psychological]);

  return <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-left">
    <summary className="cursor-pointer select-none text-[11px] font-semibold text-copper">Edit harga</summary>
    <form action={updatePricingRuleAction} className="mt-3 space-y-3">
      <input name="id" type="hidden" value={id} />
      <input name="expectedUpdatedAt" type="hidden" value={expectedUpdatedAt} />
      <label className="block text-[10px] font-semibold text-muted">Base Cost / Modal<input className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs" max={100000000} min={0} name="baseCost" onChange={(event) => setBaseCost(Number(event.target.value))} required step={1} type="number" value={baseCost} /></label>
      <label className="block text-[10px] font-semibold text-muted">Manual price override<input className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs" max={100000000} min={0} name="override" onChange={(event) => setOverride(event.target.value)} placeholder="Kosong = harga otomatis" step={1} type="number" value={override} /></label>
      <dl className="space-y-1 rounded-lg border border-[var(--border)] p-2 text-[10px]"><div className="flex justify-between gap-2"><dt className="text-muted">Raw price</dt><dd>{formatAdminCurrency(preview.raw)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Display price</dt><dd className="font-semibold">{formatAdminCurrency(preview.final)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Estimated profit</dt><dd className="font-semibold">{formatAdminCurrency(preview.profit)}</dd></div></dl>
      {preview.belowCost ? <p className="flex gap-2 rounded-lg border border-red-300 bg-red-50 p-2 text-[10px] font-semibold leading-4 text-red-800"><AlertTriangle className="mt-0.5 shrink-0" size={13} />Harga jual berada di bawah harga modal.</p> : preview.profit < 25_000 ? <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] leading-4 text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={13} />Margin sangat rendah. Periksa kembali sebelum menyimpan.</p> : <p className="flex items-center gap-2 text-[10px] text-emerald-700"><CheckCircle2 size={13} />Harga tidak berada di bawah modal.</p>}
      <button className="min-h-10 w-full rounded-lg bg-navy px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={preview.belowCost} type="submit">Simpan harga</button>
    </form>
  </details>;
}
