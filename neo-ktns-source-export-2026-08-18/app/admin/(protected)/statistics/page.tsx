import { BadgeCheck, Boxes, PackageCheck, Palette, Ruler, ShoppingBag, Tags, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getAdminStatistics, type StatisticsRange } from "@/lib/admin/business";
import { formatAdminCurrency } from "@/lib/admin/format";

export const metadata = { title: "Statistics | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function isRange(value: string): value is StatisticsRange { return ["7d", "30d", "month", "all"].includes(value); }

export default async function AdminStatisticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requested = String(first(params.range) ?? "30d");
  const range: StatisticsRange = isRange(requested) ? requested : "30d";
  let stats;
  try { stats = await getAdminStatistics(range); } catch { return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Analytics</p><h1 className="editorial mt-3 text-4xl">Statistics belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Revenue, profit, dan data order tetap privat.</div></section>; }

  const ranges: Array<[StatisticsRange, string]> = [["7d", "7 hari"], ["30d", "30 hari"], ["month", "Bulan ini"], ["all", "Semua waktu"]];
  const maxOrders = Math.max(1, ...stats.series.map((item) => item.orders));
  const maxRevenue = Math.max(1, ...stats.series.map((item) => item.revenue));
  const cards = [
    ["Total orders", stats.totalOrders, ShoppingBag], ["Selesai", stats.completedOrders, BadgeCheck], ["Aktif / berjalan", stats.activeOrders, PackageCheck], ["Batal / ditolak", stats.cancelledOrders, Boxes],
  ] as const;
  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Business analytics</p><h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Statistics.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Ringkasan operasional dari snapshot order production—tanpa memindahkan data finansial ke browser publik.</p></div><nav aria-label="Rentang statistik" className="flex flex-wrap gap-2">{ranges.map(([value, label]) => <Link className={`rounded-xl border px-3 py-2 text-xs font-semibold ${range === value ? "border-copper bg-[var(--copper-action)] text-white" : "border-[var(--border)] hover:border-copper"}`} href={`/admin/statistics?range=${value}`} key={value}>{label}</Link>)}</nav></div>
    {stats.truncated && <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Statistik dibatasi pada 5.000 order terbaru dalam rentang ini. Gunakan agregasi database lanjutan ketika volume mendekati batas tersebut.</div>}

    <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value, Icon]) => <article className="surface rounded-[var(--radius-md)] p-4 sm:p-5" key={label}><div className="flex items-start justify-between gap-2"><p className="text-xs text-muted">{label}</p><Icon className="text-copper" size={17} /></div><p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p></article>)}</div>

    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-[var(--radius-md)] bg-navy p-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/55">Revenue setelah promo</p><p className="mt-4 text-2xl font-semibold">{formatAdminCurrency(stats.revenue)}</p><p className="mt-2 text-xs text-white/50">Gross sales {formatAdminCurrency(stats.grossSales)}</p></article>
      <article className="surface rounded-[var(--radius-md)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted">Diskon diberikan</p><p className="mt-4 text-2xl font-semibold text-copper">{formatAdminCurrency(stats.discounts)}</p><p className="mt-2 text-xs text-muted">Snapshot discount order</p></article>
      <article className="surface rounded-[var(--radius-md)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted">Estimasi laba kotor</p><p className={`mt-4 text-2xl font-semibold ${stats.estimatedGrossProfit < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatAdminCurrency(stats.estimatedGrossProfit)}</p><p className="mt-2 text-xs text-muted">Revenue setelah promo − modal historis</p></article>
      <article className="surface rounded-[var(--radius-md)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted">Average order value</p><p className="mt-4 text-2xl font-semibold">{formatAdminCurrency(stats.averageOrderValue)}</p><p className="mt-2 text-xs text-muted">{stats.totalUnits} unit dipesan</p></article>
    </div>

    <div className="mt-7 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <article className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Orders & revenue</p><h2 className="mt-2 text-xl font-semibold">Pergerakan periode</h2></div><TrendingUp className="text-copper" size={21} /></div>{stats.series.length ? <div className="mt-6 space-y-4">{stats.series.slice(-31).map((point) => <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-3 text-xs" key={point.label}><span className="font-mono text-muted">{point.label}</span><div><div className="flex items-center gap-2"><span className="h-2 rounded-full bg-[var(--copper-action)]" style={{ width: `${Math.max(3, point.orders / maxOrders * 100)}%` }} /><span className="shrink-0 font-semibold">{point.orders}</span></div><div className="mt-2 flex items-center gap-2"><span className="h-2 rounded-full bg-gold" style={{ width: `${Math.max(3, point.revenue / maxRevenue * 100)}%` }} /><span className="shrink-0 text-muted">{formatAdminCurrency(point.revenue)}</span></div></div></div>)}</div> : <p className="mt-8 text-sm text-muted">Belum ada order pada rentang ini.</p>}</article>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <article className="surface rounded-[var(--radius-md)] p-5"><p className="eyebrow">Top selections</p><dl className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-muted"><Palette size={16} />Warna</dt><dd className="text-right font-semibold">{stats.topColor?.label ?? "—"}<span className="ml-2 text-xs text-muted">{stats.topColor?.quantity ?? 0}</span></dd></div><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-muted"><Ruler size={16} />Ukuran</dt><dd className="text-right font-semibold">{stats.topSize?.label ?? "—"}<span className="ml-2 text-xs text-muted">{stats.topSize?.quantity ?? 0}</span></dd></div><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-muted"><Tags size={16} />Paket</dt><dd className="text-right font-semibold">{stats.topPackage?.label ?? "—"}<span className="ml-2 text-xs text-muted">{stats.topPackage?.quantity ?? 0}</span></dd></div></dl></article>
        <article className="surface rounded-[var(--radius-md)] p-5"><p className="eyebrow">Operations</p><dl className="mt-5 grid grid-cols-2 gap-4 text-xs"><div><dt className="text-muted">Menunggu bayar</dt><dd className="mt-1 text-2xl font-semibold">{stats.waitingPayment}</dd></div><div><dt className="text-muted">Produksi</dt><dd className="mt-1 text-2xl font-semibold">{stats.inProduction}</dd></div><div><dt className="text-muted">Quality Control</dt><dd className="mt-1 text-2xl font-semibold">{stats.qualityControl}</dd></div><div><dt className="text-muted">Siap dipenuhi</dt><dd className="mt-1 text-2xl font-semibold">{stats.ready}</dd></div></dl></article>
      </div>
    </div>
  </section>;
}
