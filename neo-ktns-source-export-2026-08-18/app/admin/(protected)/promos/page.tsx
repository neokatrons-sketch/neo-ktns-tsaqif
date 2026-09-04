import { Archive, BadgePercent, CircleDollarSign, Ticket, TriangleAlert } from "lucide-react";
import { archivePromoAction, createPromoAction, togglePromoAction, updatePromoAction } from "@/app/admin/(protected)/promos/actions";
import { AdminSubmitButton, ConfirmSubmitButton } from "@/components/admin/form-buttons";
import { getAdminPromos, type AdminPromo } from "@/lib/admin/business";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";

export const metadata = { title: "Promos | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function dateTimeValue(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }

function PromoFields({ promo }: { promo?: AdminPromo }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-xs font-semibold text-muted">Kode promo<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 uppercase" defaultValue={promo?.code ?? ""} maxLength={32} name="code" placeholder="NEO10" required /></label>
    <label className="text-xs font-semibold text-muted sm:col-span-1 lg:col-span-2">Nama tampilan<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.displayName ?? ""} maxLength={120} name="displayName" placeholder="Diskon komunitas" required /></label>
    <label className="text-xs font-semibold text-muted">Jenis<select className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.discountType ?? "percentage"} name="discountType"><option value="percentage">Persentase</option><option value="fixed">Nominal tetap</option></select></label>
    <label className="text-xs font-semibold text-muted">Nilai<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.discountValue ?? 10} min={1} name="discountValue" required step={1} type="number" /></label>
    <label className="text-xs font-semibold text-muted">Maks. diskon (opsional)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.maximumDiscount ?? ""} min={0} name="maximumDiscount" placeholder="100000" step={1} type="number" /></label>
    <label className="text-xs font-semibold text-muted">Minimum subtotal<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.minimumOrder ?? 0} min={0} name="minimumOrder" required step={1} type="number" /></label>
    <label className="text-xs font-semibold text-muted">Minimum jumlah<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.minimumQuantity ?? 1} min={1} name="minimumQuantity" required step={1} type="number" /></label>
    <label className="text-xs font-semibold text-muted">Batas penggunaan (opsional)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={promo?.usageLimit ?? ""} min={1} name="usageLimit" step={1} type="number" /></label>
    <label className="text-xs font-semibold text-muted">Mulai (opsional)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={dateTimeValue(promo?.startsAt ?? null)} name="startsAt" type="datetime-local" /></label>
    <label className="text-xs font-semibold text-muted">Berakhir (opsional)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={dateTimeValue(promo?.endsAt ?? null)} name="endsAt" type="datetime-local" /></label>
    <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-[var(--border)] px-3 text-xs font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={promo?.isActive ?? false} name="isActive" type="checkbox" />Aktifkan promo</label>
  </div>;
}

function PromoCard({ promo }: { promo: AdminPromo }) {
  const archived = Boolean(promo.archivedAt);
  return <article className={`surface rounded-[var(--radius-md)] p-5 ${archived ? "opacity-65" : ""}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{promo.code}</h2><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${archived ? "border-slate-300 text-muted" : promo.isActive ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>{archived ? "Diarsipkan" : promo.isActive ? "Aktif" : "Nonaktif"}</span></div><p className="mt-1 text-sm text-muted">{promo.displayName}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[var(--background)] text-copper">{promo.discountType === "percentage" ? <BadgePercent size={19} /> : <CircleDollarSign size={19} />}</span></div>
    <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4"><div><dt className="text-muted">Diskon</dt><dd className="mt-1 font-semibold">{promo.discountType === "percentage" ? `${promo.discountValue}%` : formatAdminCurrency(promo.discountValue)}</dd></div><div><dt className="text-muted">Minimum</dt><dd className="mt-1 font-semibold">{promo.minimumQuantity} pcs</dd></div><div><dt className="text-muted">Terpakai</dt><dd className="mt-1 font-semibold">{promo.usageCount}{promo.usageLimit == null ? "" : ` / ${promo.usageLimit}`}</dd></div><div><dt className="text-muted">Diperbarui</dt><dd className="mt-1 font-semibold">{promo.updatedAt ? formatAdminDate(promo.updatedAt) : "—"}</dd></div></dl>
    {!archived && <details className="mt-5 rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer text-sm font-semibold text-copper">Edit aturan promo</summary><form action={updatePromoAction} className="mt-5"><input name="id" type="hidden" value={promo.id} /><PromoFields promo={promo} /><div className="mt-5 flex flex-wrap gap-2"><AdminSubmitButton className="min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white">Simpan perubahan</AdminSubmitButton></div></form></details>}
    {!archived && <div className="mt-4 flex flex-wrap gap-2"><form action={togglePromoAction}><input name="id" type="hidden" value={promo.id} /><button className="min-h-10 rounded-xl border border-[var(--border)] px-4 text-xs font-semibold text-copper" type="submit">{promo.isActive ? "Nonaktifkan" : "Aktifkan"}</button></form><form action={archivePromoAction}><input name="id" type="hidden" value={promo.id} /><ConfirmSubmitButton className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-700" message={`Arsipkan promo ${promo.code}? Promo akan dinonaktifkan dan histori order tetap disimpan.`}><Archive size={14} />Arsipkan</ConfirmSubmitButton></form></div>}
  </article>;
}

export default async function AdminPromosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let promos: AdminPromo[];
  try { promos = await getAdminPromos(); } catch { return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Campaigns</p><h1 className="editorial mt-3 text-4xl">Promo belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Data promo tetap privat.</div></section>; }
  const params = await searchParams;
  const success = first(params.success);
  const error = first(params.error);
  const successMessages: Record<string, string> = { created: "Promo berhasil dibuat.", updated: "Promo berhasil diperbarui.", enabled: "Promo berhasil diaktifkan.", disabled: "Promo berhasil dinonaktifkan.", archived: "Promo diarsipkan tanpa menghapus histori order." };
  const errorMessages: Record<string, string> = { validation: "Periksa kode, nilai diskon, syarat, dan rentang tanggal.", duplicate: "Kode promo sudah digunakan.", save: "Promo belum dapat disimpan. Silakan coba lagi." };
  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Campaigns</p><h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Promo & voucher.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Kelola diskon sederhana yang selalu divalidasi server-side dan tidak mengubah harga modal.</p></div><Ticket className="text-copper" size={28} /></div>
    {success && successMessages[success] && <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{successMessages[success]}</div>}
    {error && errorMessages[error] && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages[error]}</div>}
    <details className="surface mt-7 rounded-[var(--radius-md)] p-5 sm:p-7"><summary className="cursor-pointer text-lg font-semibold text-copper">Buat promo baru</summary><form action={createPromoAction} className="mt-6"><PromoFields /><div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><TriangleAlert className="mt-0.5 shrink-0" size={15} />Promo baru default-nya nonaktif. Checkout juga menolak promo yang membuat subtotal turun di bawah total modal.</div><AdminSubmitButton className="mt-5 min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white" pendingLabel="Membuat…">Buat promo</AdminSubmitButton></form></details>
    <div className="mt-8 flex items-end justify-between gap-3"><div><p className="eyebrow">Promo library</p><h2 className="mt-2 text-2xl font-semibold">{promos.length} kode</h2></div><p className="text-xs text-muted">Tidak ada diskon 10 pcs yang aktif otomatis.</p></div>
    {promos.length ? <div className="mt-5 grid gap-4 xl:grid-cols-2">{promos.map((promo) => <PromoCard key={promo.id} promo={promo} />)}</div> : <div className="surface mt-5 rounded-[var(--radius-md)] p-8 text-center text-sm text-muted">Belum ada promo. Buat promo secara eksplisit jika dibutuhkan.</div>}
  </section>;
}
