import { Clock3, CreditCard, MessageCircle, PackageCheck, Save, Truck } from "lucide-react";
import { updateBusinessSettingsAction } from "@/app/admin/(protected)/settings/actions";
import { AdminSubmitButton } from "@/components/admin/form-buttons";
import { getAdminBusinessSettings } from "@/lib/admin/business";
import { formatAdminDate } from "@/lib/admin/format";
import type { BusinessOption } from "@/lib/business-settings";

export const metadata = { title: "Settings | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function findOption(options: BusinessOption[], value: string) { return options.find((item) => item.value === value)!; }

function OptionEditor({ option, prefix }: { option: BusinessOption; prefix: string }) {
  return <article className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"><label className="flex items-center gap-3 text-sm font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={option.enabled} name={`${prefix}Enabled`} type="checkbox" />{option.value}</label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-muted">Label publik<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs" defaultValue={option.label} maxLength={80} name={`${prefix}Label`} required /></label><label className="text-[10px] font-semibold text-muted">Helper text<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs" defaultValue={option.helper} maxLength={240} name={`${prefix}Helper`} /></label></div></article>;
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let data;
  try { data = await getAdminBusinessSettings(); } catch { return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Operations</p><h1 className="editorial mt-3 text-4xl">Settings belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Sistem checkout tetap menggunakan fallback aman.</div></section>; }
  const params = await searchParams;
  const success = first(params.success);
  const error = first(params.error);
  const settings = data.settings;
  const qris = findOption(settings.paymentMethods, "QRIS");
  const cash = findOption(settings.paymentMethods, "Cash");
  const admin = findOption(settings.paymentMethods, "Konfirmasi dengan admin");
  const pickup = findOption(settings.deliveryMethods, "Ambil di sekolah");
  const cod = findOption(settings.deliveryMethods, "COD / kurir");
  const shipping = findOption(settings.deliveryMethods, "Pengiriman, ongkir dikonfirmasi admin");
  const errorMessages: Record<string, string> = { validation: "Periksa nomor WhatsApp, DP, deadline, waktu produksi, dan pesan operasional.", options: "Aktifkan setidaknya satu metode pembayaran dan satu metode penerimaan.", save: "Settings belum dapat disimpan. Silakan coba lagi." };

  return <section className="mx-auto max-w-6xl py-4 sm:py-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Operations</p><h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Business settings.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Kelola nilai bisnis yang digunakan order baru, checkout, WhatsApp, dan informasi pelanggan. Pengaturan keamanan tidak tersedia di sini.</p></div><p className="text-xs text-muted">Terakhir diperbarui<br /><strong className="text-foreground">{data.lastUpdated ? formatAdminDate(data.lastUpdated) : "Belum tercatat"}</strong></p></div>
    {success === "saved" && <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Business settings berhasil disimpan. Perubahan baru berlaku untuk order baru.</div>}
    {error && errorMessages[error] && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages[error]}</div>}

    <form action={updateBusinessSettingsAction} className="mt-7 space-y-5">
      <section className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Contact</p><h2 className="mt-2 text-xl font-semibold">WhatsApp admin</h2></div><MessageCircle className="text-copper" size={21} /></div><label className="mt-5 block max-w-xl text-xs font-semibold text-muted">Nomor format wa.me<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={settings.whatsappNumber} inputMode="tel" name="whatsappNumber" placeholder="6285725935431" required /></label><p className="mt-3 text-xs leading-5 text-muted">Gunakan nomor Indonesia/internasional tanpa password, PIN, OTP, atau kredensial lain.</p></section>

      <section className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Payments</p><h2 className="mt-2 text-xl font-semibold">Metode & DP</h2></div><CreditCard className="text-copper" size={21} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-xs font-semibold text-muted">DP minimum (%)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={settings.minimumDpPercentage} max={100} min={0} name="minimumDpPercentage" required type="number" /></label><label className="text-xs font-semibold text-muted">Batas pembayaran (jam)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={settings.paymentDeadlineHours} max={720} min={1} name="paymentDeadlineHours" required type="number" /></label><label className="text-xs font-semibold text-muted">Info QRIS opsional<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={settings.qrisInformation} maxLength={500} name="qrisInformation" placeholder="Nama merchant / instruksi aman" /></label></div><div className="mt-5 grid gap-3"><OptionEditor option={qris} prefix="paymentQris" /><OptionEditor option={cash} prefix="paymentCash" /><OptionEditor option={admin} prefix="paymentAdmin" /></div>{settings.minimumDpPercentage < 25 && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">DP di bawah 25% dapat meningkatkan risiko operasional. Nilai tetap dapat disimpan jika memang diinginkan.</p>}</section>

      <section className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Delivery</p><h2 className="mt-2 text-xl font-semibold">Metode penerimaan</h2></div><Truck className="text-copper" size={21} /></div><div className="mt-5 grid gap-3"><OptionEditor option={pickup} prefix="deliveryPickup" /><OptionEditor option={cod} prefix="deliveryCod" /><OptionEditor option={shipping} prefix="deliveryShipping" /></div></section>

      <section className="surface rounded-[var(--radius-md)] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Orders</p><h2 className="mt-2 text-xl font-semibold">Timeline & policy copy</h2></div><Clock3 className="text-copper" size={21} /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-muted">Minimum produksi (hari)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" defaultValue={settings.productionDaysMin} max={365} min={1} name="productionDaysMin" required type="number" /></label><label className="text-xs font-semibold text-muted sm:col-span-2">Preorder notice<textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" defaultValue={settings.preorderNotice} maxLength={1000} name="preorderNotice" required /></label><label className="text-xs font-semibold text-muted sm:col-span-2">Return policy singkat<textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" defaultValue={settings.returnPolicyShort} maxLength={1000} name="returnPolicyShort" required /></label><label className="text-xs font-semibold text-muted sm:col-span-2">Pickup notice<textarea className="mt-2 min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" defaultValue={settings.pickupNotice} maxLength={1000} name="pickupNotice" required /></label></div></section>

      <div className="sticky bottom-4 z-10 flex justify-end"><AdminSubmitButton className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--copper-action)] px-6 text-sm font-semibold text-white shadow-lg" pendingLabel="Menyimpan settings…"><Save size={17} />Simpan semua settings</AdminSubmitButton></div>
    </form>
    <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] bg-navy p-5 text-xs leading-6 text-white/70"><PackageCheck className="mt-0.5 shrink-0 text-gold" size={18} /><p>Order lama mempertahankan nominal DP dan snapshot ketentuan saat checkout. Perubahan di halaman ini hanya memengaruhi order baru dan copy pelanggan terbaru.</p></div>
  </section>;
}
