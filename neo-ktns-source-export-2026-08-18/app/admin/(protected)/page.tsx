import { ArrowRight, CircleDollarSign, PackageCheck, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/orders/status-badge";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";
import { getAdminDashboardData } from "@/lib/admin/orders";

export const metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  let dashboard;
  try {
    dashboard = await getAdminDashboardData();
  } catch {
    return <section className="mx-auto max-w-6xl py-8">
      <p className="eyebrow">Overview</p>
      <h1 className="editorial mt-3 text-4xl">Dashboard belum dapat dimuat.</h1>
      <div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">
        Data admin tetap aman. Muat ulang halaman atau coba beberapa saat lagi.
      </div>
    </section>;
  }

  const { metrics, recentOrders } = dashboard;
  const metricCards = [
    { label: "Total pesanan", value: metrics.total, icon: ShoppingBag },
    { label: "Menunggu pembayaran", value: metrics.waitingPayment, icon: CircleDollarSign },
    { label: "Verifikasi pembayaran", value: metrics.waitingPaymentVerification, icon: CircleDollarSign },
    { label: "Persetujuan desain", value: metrics.waitingDesignApproval, icon: PackageCheck },
    { label: "Dalam produksi", value: metrics.inProduction, icon: PackageCheck },
    { label: "Quality Control", value: metrics.qualityControl, icon: PackageCheck },
    { label: "Siap diambil / dikirim", value: metrics.ready, icon: PackageCheck },
    { label: "Selesai", value: metrics.completed, icon: PackageCheck },
  ];

  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Operations overview</p>
        <h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Orders at a glance.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Ringkasan real-time pesanan, pembayaran, produksi, dan estimasi finansial internal Neo KTNS.</p>
      </div>
      <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-[#17324f]" href="/admin/orders">Kelola pesanan <ArrowRight size={16} /></Link>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metricCards.map(({ label, value, icon: Icon }) => <article className="surface rounded-[var(--radius-md)] p-4 sm:p-5" key={label}>
        <div className="flex items-start justify-between gap-2"><p className="text-xs leading-5 text-muted">{label}</p><Icon className="shrink-0 text-copper" size={17} /></div>
        <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
      </article>)}
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <article className="rounded-[var(--radius-md)] bg-navy p-5 text-white sm:p-6">
        <div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[.14em] text-white/55">Estimasi pendapatan</p><TrendingUp className="text-gold" size={19} /></div>
        <p className="mt-5 text-2xl font-semibold sm:text-3xl">{formatAdminCurrency(metrics.estimatedRevenue)}</p>
        <p className="mt-2 text-xs leading-5 text-white/50">Total akhir digunakan bila tersedia; selain itu memakai total sementara.</p>
      </article>
      <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[.14em] text-muted">Estimasi laba kotor</p><CircleDollarSign className="text-copper" size={19} /></div>
        <p className="mt-5 text-2xl font-semibold sm:text-3xl">{formatAdminCurrency(metrics.estimatedGrossProfit)}</p>
        <p className="mt-2 text-xs leading-5 text-muted">Berdasarkan harga jual dikurangi biaya dasar item aktif.</p>
      </article>
    </div>

    <section className="mt-9">
      <div className="flex items-end justify-between gap-3">
        <div><p className="eyebrow">Recent Orders</p><h2 className="editorial mt-2 text-3xl">Pesanan terbaru</h2></div>
        <Link className="text-sm font-semibold text-copper hover:underline" href="/admin/orders">Lihat semua</Link>
      </div>

      {recentOrders.length === 0 ? <div className="surface mt-5 rounded-[var(--radius-md)] p-8 text-center text-sm text-muted">Belum ada pesanan yang telah difinalisasi.</div> : <>
        <div className="mt-5 hidden overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] lg:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs uppercase tracking-[.1em] text-muted"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Pelanggan</th><th className="px-5 py-4">Dibuat</th><th className="px-5 py-4">Item</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Status</th></tr></thead>
            <tbody>{recentOrders.map((order) => <tr className="border-t border-[var(--border)]" key={order.id}><td className="px-5 py-4"><Link className="font-semibold text-copper hover:underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td><td className="px-5 py-4 font-medium">{order.customerName}</td><td className="px-5 py-4 text-muted">{formatAdminDate(order.createdAt)}</td><td className="px-5 py-4 tabular-nums">{order.itemQuantity} pcs</td><td className="px-5 py-4 font-semibold">{formatAdminCurrency(order.temporaryTotal)}</td><td className="px-5 py-4"><StatusBadge status={order.status} /></td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 lg:hidden">{recentOrders.map((order) => <Link className="surface rounded-[var(--radius-md)] p-4" href={`/admin/orders/${order.id}`} key={order.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-copper">{order.orderNumber}</p><p className="mt-1 text-sm font-medium">{order.customerName}</p></div><StatusBadge status={order.status} /></div><div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted"><span>{formatAdminDate(order.createdAt)}</span><span>{order.itemQuantity} pcs</span></div><p className="mt-3 font-semibold">{formatAdminCurrency(order.temporaryTotal)}</p></Link>)}</div>
      </>}
    </section>
  </section>;
}
