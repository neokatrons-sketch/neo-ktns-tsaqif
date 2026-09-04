import { Calculator, CircleDollarSign, ShieldAlert } from "lucide-react";
import { updateDefaultMarginAction } from "@/app/admin/(protected)/pricing/actions";
import { PricingRuleEditor } from "@/components/admin/catalog/pricing-rule-editor";
import { getAdminPricingData } from "@/lib/admin/catalog-pricing";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";

export const metadata = { title: "Pricing | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPricingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let pricing;
  try {
    pricing = await getAdminPricingData();
  } catch {
    return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Pricing</p><h1 className="editorial mt-3 text-4xl">Pricing belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Biaya dasar dan margin tetap privat.</div></section>;
  }

  const params = await searchParams;
  const success = first(params.success);
  const error = first(params.error);
  const successMessages: Record<string, string> = {
    pricing: "Base cost berhasil disimpan dan harga otomatis telah diperbarui untuk order baru.",
    override: "Manual price override berhasil disimpan.",
    margin: "Default margin berhasil diperbarui untuk kalkulasi order baru.",
  };
  const errorMessages: Record<string, string> = {
    pricing: "Perubahan harga belum dapat disimpan. Silakan coba lagi.",
    margin: "Perubahan margin belum dapat disimpan. Silakan coba lagi.",
    invalid_amount: "Base cost atau override tidak valid.",
    invalid_margin: "Default margin harus berupa nominal nol atau lebih.",
    below_cost: "Harga jual berada di bawah harga modal. Perubahan diblokir.",
    conflict: "Data harga telah berubah dari sesi lain. Muat ulang sebelum menyimpan kembali.",
  };
  const ruleMap = new Map(pricing.rules.map((rule) => [`${rule.embroidery_package_id}:${rule.product_size_id}`, rule]));
  const activeRuleCount = pricing.rules.filter((rule) => rule.is_active).length;

  return <section className="mx-auto max-w-[1500px] py-4 sm:py-7">
    <div><p className="eyebrow">Commercial control</p><h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Pricing & profit.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Kelola modal, margin, harga psikologis, dan override tanpa mengubah snapshot harga pesanan lama.</p></div>
    {success && successMessages[success] && <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{successMessages[success]}</div>}
    {error && errorMessages[error] && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages[error]}</div>}

    <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(330px,.55fr)]">
      <article className="rounded-[var(--radius-md)] bg-navy p-5 text-white sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">Default margin</p><p className="mt-3 text-3xl font-semibold">{formatAdminCurrency(pricing.margin.value)}</p><p className="mt-2 text-xs text-white/55">per unit · diperbarui {formatAdminDate(pricing.margin.updatedAt)}</p></div><CircleDollarSign className="text-gold" size={24} /></div><form action={updateDefaultMarginAction} className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-end"><input name="expectedUpdatedAt" type="hidden" value={pricing.margin.updatedAt ?? ""} /><label className="flex-1 text-xs font-semibold text-white/65">Margin baru (Rp)<input className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/35" defaultValue={pricing.margin.value} max={100000000} min={0} name="margin" required step={1} type="number" /></label><button className="min-h-11 rounded-xl bg-[var(--copper-action)] px-5 text-sm font-semibold text-white" type="submit">Simpan margin</button></form></article>
      <article className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Pricing engine</p><h2 className="mt-2 text-xl font-semibold">Server-authoritative</h2></div><Calculator className="text-copper" size={22} /></div><div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-7"><p>Base cost + default margin</p><p className="text-muted">→ raw selling price</p><p className="text-muted">→ {pricing.psychological ? "psychological rounding aktif" : "tanpa rounding"}</p><p className="font-semibold text-copper">→ optional manual override</p></div><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><ShieldAlert className="mt-0.5 shrink-0 text-copper" size={15} />Modal, margin, override metadata, dan profit tidak dikirim ke halaman pelanggan.</p></article>
    </div>

    <div className="mt-9 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Base-cost matrix</p><h2 className="mt-2 text-2xl font-semibold">{activeRuleCount} aturan harga</h2></div><p className="max-w-lg text-right text-xs leading-5 text-muted">Kosongkan override untuk kembali ke harga otomatis. Override di bawah modal selalu diblokir.</p></div>

    <div className="mt-5 hidden overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] lg:block">
      <table className="w-full min-w-[1250px] table-fixed text-left text-xs">
        <thead className="bg-navy text-white"><tr><th className="w-48 px-4 py-4">Paket</th>{pricing.sizes.map((size) => <th className="px-3 py-4 text-center" key={size.id}>{size.code}<span className="mt-1 block text-[9px] font-normal text-white/50">{size.is_available ? "Tersedia" : "Nonaktif"}</span></th>)}</tr></thead>
        <tbody>{pricing.packages.map((pkg) => <tr className="border-t border-[var(--border)] align-top" key={pkg.id}><th className="bg-[var(--surface)] px-4 py-4"><p className="font-semibold">{pkg.name_id}</p><p className="mt-1 text-[10px] font-normal text-muted">{pkg.is_active ? "Paket aktif" : "Paket nonaktif"}</p></th>{pricing.sizes.map((size) => {
          const rule = ruleMap.get(`${pkg.id}:${size.id}`);
          return <td className="px-3 py-4" key={size.id}>{rule ? <div><p className="text-[10px] text-muted">Base Cost / Modal</p><p className="mt-1 font-semibold">{formatAdminCurrency(rule.baseCost)}</p><div className="mt-2 border-t border-[var(--border)] pt-2"><p className="text-[10px] text-muted">Final display</p><p className="mt-1 font-semibold text-copper">{formatAdminCurrency(rule.finalPrice)}</p><p className="mt-1 text-[10px] text-emerald-700">Profit {formatAdminCurrency(rule.profit)}</p>{rule.override != null && <span className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">Manual override</span>}</div><PricingRuleEditor id={rule.id} expectedUpdatedAt={rule.updated_at} baseCost={rule.baseCost} override={rule.override} margin={pricing.margin.value} psychological={pricing.psychological} /></div> : <span className="text-muted">Tidak ada rule</span>}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>

    <div className="mt-5 grid gap-4 lg:hidden">{pricing.packages.map((pkg) => <details className="surface rounded-[var(--radius-md)] p-4" key={pkg.id}><summary className="cursor-pointer select-none font-semibold">{pkg.name_id}<span className="ml-2 text-xs font-normal text-muted">{pkg.is_active ? "Aktif" : "Nonaktif"}</span></summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{pricing.sizes.map((size) => {
      const rule = ruleMap.get(`${pkg.id}:${size.id}`);
      return <article className="rounded-xl border border-[var(--border)] p-3" key={size.id}><div className="flex items-center justify-between gap-2"><p className="font-semibold">Size {size.code}</p>{rule?.override != null && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">Override</span>}</div>{rule ? <><dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-muted">Base Cost / Modal</dt><dd className="font-semibold">{formatAdminCurrency(rule.baseCost)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Display price</dt><dd className="font-semibold text-copper">{formatAdminCurrency(rule.finalPrice)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Profit</dt><dd className="font-semibold text-emerald-700">{formatAdminCurrency(rule.profit)}</dd></div></dl><PricingRuleEditor id={rule.id} expectedUpdatedAt={rule.updated_at} baseCost={rule.baseCost} override={rule.override} margin={pricing.margin.value} psychological={pricing.psychological} /></> : <p className="mt-3 text-xs text-muted">Rule belum tersedia.</p>}</article>;
    })}</div></details>)}</div>
  </section>;
}
