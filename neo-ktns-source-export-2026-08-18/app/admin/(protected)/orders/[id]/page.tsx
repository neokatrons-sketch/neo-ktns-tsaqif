import { ArrowLeft, ExternalLink, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAdminNoteAction } from "@/app/admin/(protected)/orders/actions";
import {
  DesignFileDownloadButton,
  PaymentConfirmationForm,
  StatusUpdateForm,
} from "@/components/admin/orders/order-action-forms";
import { StatusBadge } from "@/components/admin/orders/status-badge";
import {
  adminDeliveryMethodLabel,
  adminPaymentMethodLabel,
  formatAdminCurrency,
  formatAdminDate,
  placementLabel,
} from "@/lib/admin/format";
import { getAdminOrderDetail } from "@/lib/admin/orders";

export const metadata = { title: "Order Detail | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function paymentStateLabel(status: string) {
  if (status === "paid") return "Lunas";
  if (status === "dp_verified") return "DP Diterima";
  return "Belum Dibayar";
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  let order;
  try {
    order = await getAdminOrderDetail(id);
  } catch {
    return <section className="mx-auto max-w-6xl py-4 sm:py-7"><Link className="inline-flex items-center gap-2 text-sm text-muted hover:text-copper" href="/admin/orders"><ArrowLeft size={16} />Kembali ke orders</Link><h1 className="editorial mt-6 text-4xl">Detail pesanan belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Data pelanggan tetap privat.</div></section>;
  }
  if (!order) notFound();

  const query = await searchParams;
  const success = first(query.success);
  const error = first(query.error);
  const total = order.finalTotal ?? order.temporaryTotal;
  const remaining = Math.max(total - order.paymentAmount, 0);
  const grossProfit = order.items.reduce((sum, item) => sum + item.unitProfit * item.quantity, 0);
  const canvaUrl = safeExternalUrl(order.canvaUrl);
  const whatsappDigits = order.customer.whatsapp.replace(/\D/g, "");
  const successMessage: Record<string, string> = {
    status: "Status pesanan berhasil diperbarui dan dicatat pada riwayat.",
    payment: "Konfirmasi pembayaran berhasil disimpan.",
    note: "Catatan internal berhasil disimpan.",
  };
  const errorMessage: Record<string, string> = {
    status: "Status belum dapat diperbarui. Coba lagi.",
    payment: "Pembayaran belum dapat dikonfirmasi. Coba lagi.",
    payment_amount: "Nominal tidak sesuai: DP harus minimal 50% dan pembayaran lunas harus sama dengan total.",
    note: "Catatan internal belum dapat disimpan. Coba lagi.",
  };

  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <Link className="inline-flex items-center gap-2 text-sm text-muted hover:text-copper" href="/admin/orders"><ArrowLeft size={16} />Kembali ke orders</Link>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="eyebrow">Order detail</p><h1 className="editorial mt-3 text-4xl sm:text-5xl">{order.orderNumber}</h1><p className="mt-3 text-sm text-muted">Dibuat {formatAdminDate(order.createdAt)} · diperbarui {formatAdminDate(order.updatedAt)}</p></div>
      <StatusBadge status={order.status} />
    </div>

    {success && successMessage[success] && <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{successMessage[success]}</div>}
    {error && errorMessage[error] && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage[error]}</div>}

    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,.75fr)]">
      <div className="min-w-0 space-y-6">
        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Customer</p><h2 className="mt-2 text-xl font-semibold">{order.customer.fullName}</h2></div>{whatsappDigits && <a className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-copper hover:border-copper" href={`https://wa.me/${whatsappDigits}`} rel="noreferrer" target="_blank"><MessageCircle size={15} />Buka WhatsApp</a>}</div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted">WhatsApp</dt><dd className="mt-1 font-medium">{order.customer.whatsapp}</dd></div><div><dt className="text-xs text-muted">Metode penerimaan</dt><dd className="mt-1 font-medium">{adminDeliveryMethodLabel(order.deliveryMethod)}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-muted">Alamat</dt><dd className="mt-1 whitespace-pre-wrap font-medium leading-6">{order.customer.address}</dd></div></dl>
          {order.customerNote && <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-muted">Catatan pelanggan</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{order.customerNote}</p></div>}
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <div><p className="eyebrow">Line items</p><h2 className="mt-2 text-xl font-semibold">Detail konfigurasi</h2></div>
          <div className="mt-5 space-y-4">{order.items.map((item, index) => <section className="rounded-xl border border-[var(--border)] p-4" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-white">{index + 1}</span><div><h3 className="font-semibold">{item.productName}</h3><p className="mt-1 text-xs text-muted">{item.packageName}</p></div></div><p className="font-semibold">{formatAdminCurrency(item.lineTotal)}</p></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4"><div><dt className="text-muted">Warna</dt><dd className="mt-1 flex items-center gap-2 font-medium"><span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: item.colorHex }} />{item.colorName}</dd></div><div><dt className="text-muted">Ukuran</dt><dd className="mt-1 font-medium">{item.sizeCode}</dd></div><div><dt className="text-muted">Jumlah</dt><dd className="mt-1 font-medium">{item.quantity} pcs</dd></div><div><dt className="text-muted">Posisi</dt><dd className="mt-1 font-medium">{item.placements.map(placementLabel).join(", ") || "-"}</dd></div></dl><div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 text-xs sm:grid-cols-3"><p><span className="text-muted">Biaya dasar:</span> <strong>{formatAdminCurrency(item.unitBaseCost)}</strong></p><p><span className="text-muted">Harga jual:</span> <strong>{formatAdminCurrency(item.unitSellingPrice)}</strong></p><p><span className="text-muted">Laba/unit:</span> <strong className="text-emerald-700">{formatAdminCurrency(item.unitProfit)}</strong></p></div></section>)}</div>
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <p className="eyebrow">Financials</p><h2 className="mt-2 text-xl font-semibold">Ringkasan nilai pesanan</h2>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted">Subtotal</dt><dd className="font-medium">{formatAdminCurrency(order.subtotal)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Ongkir</dt><dd className="font-medium">{order.shippingCost == null ? "Belum ditetapkan" : formatAdminCurrency(order.shippingCost)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Diskon{order.promoCode ? ` · ${order.promoCode}` : ""}</dt><dd className="font-medium">− {formatAdminCurrency(order.discountAmount)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Total sementara</dt><dd className="font-medium">{formatAdminCurrency(order.temporaryTotal)}</dd></div><div className="flex justify-between gap-4 border-t border-[var(--border)] pt-4"><dt className="font-semibold">Total akhir</dt><dd className="text-lg font-semibold">{order.finalTotal == null ? "Belum ditetapkan" : formatAdminCurrency(order.finalTotal)}</dd></div><div className="flex justify-between gap-4 rounded-xl bg-emerald-50 p-3 text-emerald-900"><dt className="font-semibold">Estimasi laba kotor</dt><dd className="font-semibold">{formatAdminCurrency(grossProfit)}</dd></div></dl>
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Design files</p><h2 className="mt-2 text-xl font-semibold">File desain privat</h2></div>{canvaUrl && <a className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-copper hover:border-copper" href={canvaUrl} rel="noreferrer" target="_blank">Buka Canva <ExternalLink size={14} /></a>}</div>
          {order.files.length === 0 ? <p className="mt-5 text-sm text-muted">Tidak ada file desain pada pesanan ini.</p> : <div className="mt-5 space-y-3">{order.files.map((file) => <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between" key={file.id}><div className="flex min-w-0 items-start gap-3"><FileText className="mt-0.5 shrink-0 text-copper" size={19} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{file.originalFilename}</p><p className="mt-1 text-xs text-muted">{(file.sizeBytes / 1024).toFixed(1)} KB · {file.reviewStatus} · {formatAdminDate(file.uploadedAt)}</p></div></div><DesignFileDownloadButton fileId={file.id} /></div>)}</div>}
          <p className="mt-4 text-xs leading-5 text-muted">Tautan unduhan dibuat hanya setelah sesi admin aktif diverifikasi dan berlaku singkat.</p>
        </article>
      </div>

      <aside className="space-y-6">
        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <p className="eyebrow">Payment</p><h2 className="mt-2 text-xl font-semibold">Verifikasi manual</h2>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Metode</dt><dd className="font-medium">{adminPaymentMethodLabel(order.paymentMethod)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd className="font-semibold text-copper">{paymentStateLabel(order.paymentStatus)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Diterima</dt><dd className="font-medium">{formatAdminCurrency(order.paymentAmount)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Sisa</dt><dd className="font-medium">{formatAdminCurrency(remaining)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Dikonfirmasi</dt><dd className="text-right text-xs font-medium">{formatAdminDate(order.paymentConfirmedAt)}{order.paymentConfirmedBy ? <><br />oleh {order.paymentConfirmedBy}</> : null}</dd></div></dl>
          <div className="my-5 h-px bg-[var(--border)]" />
          <PaymentConfirmationForm orderId={order.id} total={total} minimumDp={order.minimumDp} paymentAmount={order.paymentAmount} paymentStatus={order.paymentStatus} paymentNote={order.paymentNote} />
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <p className="eyebrow">Workflow</p><h2 className="mt-2 text-xl font-semibold">Perbarui status</h2><p className="mt-2 text-xs leading-5 text-muted">Setiap perubahan disimpan atomik bersama identitas admin dan riwayatnya.</p><div className="mt-5"><StatusUpdateForm orderId={order.id} currentStatus={order.status} /></div>
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <p className="eyebrow">Internal note</p><h2 className="mt-2 text-xl font-semibold">Catatan admin</h2><p className="mt-2 text-xs leading-5 text-muted">Catatan ini tidak pernah muncul pada halaman pelanggan atau pesan WhatsApp.</p>
          <form action={saveAdminNoteAction} className="mt-5 space-y-4"><input name="orderId" type="hidden" value={order.id} /><textarea className="min-h-36 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" defaultValue={order.adminNote ?? ""} maxLength={4000} name="adminNote" placeholder="Catatan operasional internal" /><button className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-[#17324f]" type="submit">Simpan catatan</button></form>
        </article>

        <article className="surface rounded-[var(--radius-md)] p-5 sm:p-6">
          <p className="eyebrow">Status history</p><h2 className="mt-2 text-xl font-semibold">Riwayat pesanan</h2>
          {order.statusLogs.length === 0 ? <p className="mt-5 text-sm text-muted">Belum ada perubahan status.</p> : <ol className="mt-5 space-y-4">{order.statusLogs.map((log) => <li className="relative border-l border-[var(--border)] pl-4" key={log.id}><span className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-[var(--surface)] bg-[var(--copper-action)]" /><p className="text-sm font-semibold">{log.toStatus}</p><p className="mt-1 text-xs text-muted">{formatAdminDate(log.createdAt)}{log.changedBy ? ` · ${log.changedBy}` : ""}</p>{log.note && <p className="mt-2 whitespace-pre-wrap text-xs leading-5">{log.note}</p>}</li>)}</ol>}
        </article>
      </aside>
    </div>
  </section>;
}
