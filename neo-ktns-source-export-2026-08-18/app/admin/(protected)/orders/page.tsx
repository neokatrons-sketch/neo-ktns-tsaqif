import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/orders/status-badge";
import {
  adminDeliveryMethodLabel,
  adminPaymentMethodLabel,
  formatAdminCurrency,
  formatAdminDate,
} from "@/lib/admin/format";
import { getAdminOrders } from "@/lib/admin/orders";
import { orderStatuses } from "@/lib/orders/statuses";

export const metadata = { title: "Orders | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(input: { q: string; status: string; sort: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status !== "all") params.set("status", input.status);
  if (input.sort !== "newest") params.set("sort", input.sort);
  params.set("page", String(input.page));
  return `/admin/orders?${params.toString()}`;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = String(first(params.q) ?? "").trim().slice(0, 120);
  const status = String(first(params.status) ?? "all");
  const sort = first(params.sort) === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number.parseInt(String(first(params.page) ?? "1"), 10) || 1);

  let result;
  try {
    result = await getAdminOrders({ query: q, status, sort, page });
  } catch {
    return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Orders</p><h1 className="editorial mt-3 text-4xl">Daftar pesanan belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Tidak ada data privat yang dibuka ke publik.</div></section>;
  }

  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <div>
      <p className="eyebrow">Orders management</p>
      <h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Pesanan pelanggan.</h1>
      <p className="mt-3 text-sm leading-7 text-muted">Cari, saring, dan buka detail pesanan tanpa memuat seluruh riwayat sekaligus.</p>
    </div>

    <form className="surface mt-7 grid gap-3 rounded-[var(--radius-md)] p-4 md:grid-cols-[minmax(0,1fr)_260px_180px_auto]" method="get">
      <label className="relative block">
        <span className="sr-only">Cari pesanan</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
        <input className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-3 text-sm" defaultValue={q} name="q" placeholder="Nomor order, nama, atau WhatsApp" />
      </label>
      <label><span className="sr-only">Filter status</span><select className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={status} name="status"><option value="all">Semua status</option>{orderStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span className="sr-only">Urutan tanggal</span><select className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={sort} name="sort"><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select></label>
      <button className="min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-[#17324f]" type="submit">Terapkan</button>
    </form>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><p>{result.total} pesanan ditemukan</p><p>Halaman {Math.min(result.page, result.totalPages)} dari {result.totalPages}</p></div>

    {result.orders.length === 0 ? <div className="surface mt-4 rounded-[var(--radius-md)] p-10 text-center"><p className="font-semibold">Tidak ada pesanan yang cocok.</p><p className="mt-2 text-sm text-muted">Ubah kata pencarian atau filter status.</p></div> : <>
      <div className="mt-4 hidden overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] xl:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-[var(--surface)] text-[11px] uppercase tracking-[.09em] text-muted"><tr><th className="px-4 py-4">Order</th><th className="px-4 py-4">Pelanggan</th><th className="px-4 py-4">WhatsApp</th><th className="px-4 py-4">Dibuat</th><th className="px-4 py-4">Jumlah</th><th className="px-4 py-4">Total sementara</th><th className="px-4 py-4">Pembayaran</th><th className="px-4 py-4">Penerimaan</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Aksi</th></tr></thead>
          <tbody>{result.orders.map((order) => <tr className="border-t border-[var(--border)] align-top" key={order.id}><td className="px-4 py-4 font-semibold text-copper">{order.orderNumber}</td><td className="px-4 py-4 font-medium">{order.customerName}</td><td className="px-4 py-4 text-muted">{order.whatsapp}</td><td className="px-4 py-4 text-xs text-muted">{formatAdminDate(order.createdAt)}</td><td className="px-4 py-4 tabular-nums">{order.itemQuantity} pcs</td><td className="px-4 py-4 font-semibold">{formatAdminCurrency(order.temporaryTotal)}</td><td className="px-4 py-4 text-xs">{adminPaymentMethodLabel(order.paymentMethod)}</td><td className="px-4 py-4 text-xs">{adminDeliveryMethodLabel(order.deliveryMethod)}</td><td className="px-4 py-4"><StatusBadge status={order.status} /></td><td className="px-4 py-4"><Link className="font-semibold text-copper hover:underline" href={`/admin/orders/${order.id}`}>Detail</Link></td></tr>)}</tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 xl:hidden">{result.orders.map((order) => <article className="surface rounded-[var(--radius-md)] p-4" key={order.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><Link className="font-semibold text-copper hover:underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><p className="mt-1 font-medium">{order.customerName}</p><p className="mt-1 text-xs text-muted">{order.whatsapp}</p></div><StatusBadge status={order.status} /></div><dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs"><div><dt className="text-muted">Dibuat</dt><dd className="mt-1 font-medium">{formatAdminDate(order.createdAt)}</dd></div><div><dt className="text-muted">Jumlah</dt><dd className="mt-1 font-medium">{order.itemQuantity} pcs</dd></div><div><dt className="text-muted">Pembayaran</dt><dd className="mt-1 font-medium">{adminPaymentMethodLabel(order.paymentMethod)}</dd></div><div><dt className="text-muted">Penerimaan</dt><dd className="mt-1 font-medium">{adminDeliveryMethodLabel(order.deliveryMethod)}</dd></div></dl><div className="mt-5 flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4"><div><p className="text-xs text-muted">Total sementara</p><p className="mt-1 font-semibold">{formatAdminCurrency(order.temporaryTotal)}</p></div><Link className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-copper" href={`/admin/orders/${order.id}`}>Buka</Link></div></article>)}</div>
    </>}

    {result.totalPages > 1 && <nav aria-label="Pagination" className="mt-7 flex items-center justify-between gap-3"><Link aria-disabled={result.page <= 1} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold ${result.page <= 1 ? "pointer-events-none opacity-40" : "hover:border-copper hover:text-copper"}`} href={pageHref({ q, status, sort, page: Math.max(1, result.page - 1) })}><ArrowLeft size={16} />Sebelumnya</Link><Link aria-disabled={result.page >= result.totalPages} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold ${result.page >= result.totalPages ? "pointer-events-none opacity-40" : "hover:border-copper hover:text-copper"}`} href={pageHref({ q, status, sort, page: Math.min(result.totalPages, result.page + 1) })}>Berikutnya<ArrowRight size={16} /></Link></nav>}
  </section>;
}
