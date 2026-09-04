import { AlertCircle, Box, Palette, Ruler, Scissors } from "lucide-react";
import {
  updateColorAvailabilityAction,
  updatePackageAction,
  updateProductAction,
  updateSizeAvailabilityAction,
} from "@/app/admin/(protected)/products/actions";
import { getAdminCatalogData } from "@/lib/admin/catalog-pricing";
import { formatAdminDate } from "@/lib/admin/format";

export const metadata = { title: "Products | Neo KTNS Admin" };
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatusChip({ active, inactiveLabel = "Tidak tersedia" }: { active: boolean; inactiveLabel?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-100 text-slate-600"}`}>{active ? "Aktif" : inactiveLabel}</span>;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let catalog;
  try {
    catalog = await getAdminCatalogData();
  } catch {
    return <section className="mx-auto max-w-7xl py-4 sm:py-7"><p className="eyebrow">Catalog</p><h1 className="editorial mt-3 text-4xl">Data produk belum dapat dimuat.</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Tidak ada data privat yang dibuka ke publik.</div></section>;
  }

  const params = await searchParams;
  const success = first(params.success);
  const error = first(params.error);
  const successMessages: Record<string, string> = {
    product: "Informasi produk berhasil diperbarui.",
    color: "Ketersediaan warna berhasil diperbarui.",
    size: "Ketersediaan ukuran berhasil diperbarui.",
    package: "Paket bordir berhasil diperbarui.",
  };
  const errorMessages: Record<string, string> = {
    product: "Informasi produk belum dapat disimpan. Silakan coba lagi.",
    product_validation: "Periksa kembali nama, material, gramasi, dan waktu produksi.",
    color: "Perubahan warna belum dapat disimpan. Silakan coba lagi.",
    color_validation: "Urutan warna belum valid.",
    size: "Perubahan ukuran belum dapat disimpan. Silakan coba lagi.",
    size_validation: "Urutan ukuran belum valid.",
    package: "Perubahan paket belum dapat disimpan. Silakan coba lagi.",
    package_validation: "Nama atau urutan paket belum valid.",
    conflict: "Data telah diperbarui dari sesi lain. Muat ulang sebelum menyimpan kembali.",
  };
  const { product, colors, sizes, packages } = catalog;

  return <section className="mx-auto max-w-7xl py-4 sm:py-7">
    <div><p className="eyebrow">Catalog control</p><h1 className="editorial mt-3 text-4xl leading-tight sm:text-5xl">Product & availability.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Kelola informasi publik dan ketersediaan tanpa menghapus referensi yang dipakai pesanan lama.</p></div>
    {success && successMessages[success] && <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{successMessages[success]}</div>}
    {error && errorMessages[error] && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages[error]}</div>}

    <article className="surface mt-7 rounded-[var(--radius-md)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white"><Box size={19} /></span><div><p className="eyebrow">Main product</p><h2 className="mt-2 text-xl font-semibold">Premium Polo Pique 24s</h2><p className="mt-1 text-xs text-muted">Terakhir diperbarui {formatAdminDate(product.updated_at)}</p></div></div><StatusChip active={product.is_active} inactiveLabel="Nonaktif" /></div>
      <form action={updateProductAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input name="id" type="hidden" value={product.id} /><input name="expectedUpdatedAt" type="hidden" value={product.updated_at} />
        <label className="text-xs font-semibold text-muted">Nama tampilan<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.name_id} maxLength={120} name="nameId" required /></label>
        <label className="text-xs font-semibold text-muted">English display name<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.name_en} maxLength={120} name="nameEn" required /></label>
        <label className="text-xs font-semibold text-muted md:col-span-2">Deskripsi singkat<textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" defaultValue={product.description_id ?? ""} maxLength={1000} name="descriptionId" /></label>
        <label className="text-xs font-semibold text-muted md:col-span-2">Material<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.material} maxLength={160} name="material" required /></label>
        <label className="text-xs font-semibold text-muted">Gramasi minimum (gsm)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.weight_gsm_min ?? ""} max={1000} min={1} name="weightMin" required type="number" /></label>
        <label className="text-xs font-semibold text-muted">Gramasi maksimum (gsm)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.weight_gsm_max ?? ""} max={1000} min={1} name="weightMax" required type="number" /></label>
        <label className="text-xs font-semibold text-muted">Minimum produksi preorder (hari)<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" defaultValue={product.production_days_min} max={365} min={1} name="productionDays" required type="number" /></label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-[var(--border)] px-3 text-sm font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={product.is_active} name="isActive" type="checkbox" />Produk aktif untuk pelanggan</label>
        <div className="md:col-span-2"><button className="min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-[#17324f]" type="submit">Simpan informasi produk</button></div>
      </form>
    </article>

    <section className="mt-8" id="colors"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Colors</p><h2 className="mt-2 text-2xl font-semibold">Ketersediaan warna</h2></div><Palette className="text-copper" size={22} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{colors.map((color) => <form action={updateColorAvailabilityAction} className="surface rounded-[var(--radius-md)] p-4" key={color.id}><input name="id" type="hidden" value={color.id} /><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="size-8 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color.hex_color }} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{color.name_id}</p><p className="text-xs text-muted">{color.name_en}</p></div></div><StatusChip active={color.is_available} /></div><div className="mt-4 grid grid-cols-[1fr_90px] gap-2"><label className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={color.is_available} name="isAvailable" type="checkbox" />Aktif</label><label className="text-[10px] font-semibold text-muted">Urutan<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-xs" defaultValue={color.sort_order} max={999} min={0} name="sortOrder" required type="number" /></label></div><button className="mt-3 min-h-10 w-full rounded-xl border border-[var(--border)] text-xs font-semibold text-copper hover:border-copper" type="submit">Simpan warna</button></form>)}</div></section>

    <section className="mt-8" id="sizes"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Sizes</p><h2 className="mt-2 text-2xl font-semibold">Ketersediaan ukuran</h2></div><Ruler className="text-copper" size={22} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{sizes.map((size) => <form action={updateSizeAvailabilityAction} className="surface rounded-[var(--radius-md)] p-4" key={size.id}><input name="id" type="hidden" value={size.id} /><div className="flex items-start justify-between gap-3"><p className="text-xl font-semibold">{size.code}</p><StatusChip active={size.is_available} /></div><p className="mt-3 text-xs leading-5 text-muted">{size.length_cm != null && size.chest_circumference_cm != null ? `${size.length_cm} cm panjang · ${size.chest_circumference_cm} cm lingkar dada` : "Public measurement data not configured."}</p><div className="mt-4 space-y-2"><label className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={size.is_available} name="isAvailable" type="checkbox" />Tersedia dipesan</label><label className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={size.is_public} name="isPublic" type="checkbox" />Tampil publik</label><label className="block text-[10px] font-semibold text-muted">Urutan<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-xs" defaultValue={size.sort_order} max={999} min={0} name="sortOrder" required type="number" /></label></div><button className="mt-3 min-h-10 w-full rounded-xl border border-[var(--border)] text-xs font-semibold text-copper hover:border-copper" type="submit">Simpan ukuran</button></form>)}</div></section>

    <section className="mt-8" id="packages"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Embroidery packages</p><h2 className="mt-2 text-2xl font-semibold">Paket bordir</h2></div><Scissors className="text-copper" size={22} /></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{packages.map((item) => <form action={updatePackageAction} className="surface rounded-[var(--radius-md)] p-5" key={item.id}><input name="id" type="hidden" value={item.id} /><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-semibold">{item.name_id}</p><p className="mt-1 text-xs text-muted">{item.code}</p></div><StatusChip active={item.is_active} /></div><div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs leading-5"><p><strong>Placement:</strong> {item.placementRule}</p><p className="mt-1"><strong>Batas ukuran:</strong> {item.maxSize}</p><p className="mt-2 flex items-start gap-2 text-muted"><AlertCircle className="mt-0.5 shrink-0" size={14} />Aturan struktural placement hanya dapat dilihat dan tetap dikelola sistem.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-muted">Label pelanggan<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs" defaultValue={item.name_id} maxLength={120} name="nameId" required /></label><label className="text-[10px] font-semibold text-muted">English label<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs" defaultValue={item.name_en} maxLength={120} name="nameEn" required /></label><label className="text-[10px] font-semibold text-muted sm:col-span-2">Deskripsi pelanggan<textarea className="mt-1 min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs" defaultValue={item.description_id ?? ""} maxLength={1000} name="descriptionId" /></label><label className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold"><input className="size-4 accent-[#b56a3c]" defaultChecked={item.is_active} name="isActive" type="checkbox" />Paket aktif</label><label className="text-[10px] font-semibold text-muted">Urutan<input className="mt-1 min-h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-xs" defaultValue={item.sort_order} max={999} min={0} name="sortOrder" required type="number" /></label></div><button className="mt-4 min-h-10 rounded-xl bg-navy px-4 text-xs font-semibold text-white" type="submit">Simpan paket</button></form>)}</div></section>
  </section>;
}
