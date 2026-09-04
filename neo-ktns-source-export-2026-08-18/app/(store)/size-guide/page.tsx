import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";

export const metadata = { title: "Size Guide" };
export const dynamic = "force-dynamic";

export default async function SizeGuidePage() {
  let publicSizes = [] as Awaited<ReturnType<typeof getPublicConfiguratorCatalog>>["sizes"];
  try {
    const catalog = await getPublicConfiguratorCatalog();
    publicSizes = catalog.sizes.filter((size) => size.public);
  } catch {
    // The safe empty state below avoids showing stale availability.
  }

  return <main><PageHero eyebrow="Fit & measurements" title="Choose the right fit." description="Ukur polo yang paling nyaman kamu gunakan, lalu bandingkan dengan panduan berikut." /><Container className="py-16 sm:py-24">{publicSizes.length ? <><div className="grid gap-8 pb-10 sm:grid-cols-3"><div><p className="font-mono text-[10px] text-muted">01</p><p className="mt-2 text-sm font-semibold">Bentangkan polo</p><p className="mt-2 text-xs leading-6 text-muted">Letakkan di permukaan rata tanpa menarik kain.</p></div><div><p className="font-mono text-[10px] text-muted">02</p><p className="mt-2 text-sm font-semibold">Ukur panjang</p><p className="mt-2 text-xs leading-6 text-muted">Dari titik bahu tertinggi hingga ujung bawah.</p></div><div><p className="font-mono text-[10px] text-muted">03</p><p className="mt-2 text-sm font-semibold">Bandingkan dada</p><p className="mt-2 text-xs leading-6 text-muted">Gunakan lingkar dada pada tabel untuk memilih fit.</p></div></div><div className="overflow-x-auto border-y border-[var(--border)]"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-navy text-[#f6f4ef]"><tr><th className="p-4 sm:p-5">Size</th><th className="p-4 sm:p-5">Panjang</th><th className="p-4 sm:p-5">Lingkar dada</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{publicSizes.map((size) => <tr key={size.code}><th className="p-4 font-semibold sm:p-5">{size.code}</th><td className="p-4 text-muted sm:p-5">{size.length == null ? "Belum dikonfigurasi" : `${size.length} cm`}</td><td className="p-4 text-muted sm:p-5">{size.chest == null ? "Belum dikonfigurasi" : `${size.chest} cm`}</td></tr>)}</tbody></table></div><p className="mt-5 text-sm leading-7 text-muted">Ukuran dapat memiliki toleransi produksi yang wajar. Data pengukuran yang belum diverifikasi tidak akan dibuat-buat.</p></> : <div className="surface rounded-[var(--radius-lg)] p-8 text-center"><p className="font-semibold">Panduan ukuran sedang diperbarui.</p><p className="mt-2 text-sm text-muted">Silakan coba lagi beberapa saat lagi.</p></div>}</Container></main>;
}
