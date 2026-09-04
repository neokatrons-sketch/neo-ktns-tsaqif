import { ArrowDown, Check, Clock3, Scissors, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CustomBuilder } from "@/components/product/custom-builder";
import { ProductSupportInfo } from "@/components/product/product-support-info";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";
import { formatRupiah } from "@/lib/utils";
import { getBusinessSettings } from "@/lib/business-settings";

export const metadata = { title: "Premium Polo Configurator" };
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let catalog;
  try {
    catalog = await getPublicConfiguratorCatalog();
  } catch {
    notFound();
  }
  if (slug !== catalog.product.slug) notFound();
  const settings = await getBusinessSettings();
  const product = catalog.product;
  const colors = catalog.colors;
  const startingPrice = catalog.prices["one-point:S"] ?? Math.min(...Object.values(catalog.prices));

  return (
    <main>
      <Container className="py-10 sm:py-16 lg:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="product-canvas piqué-texture relative min-h-[520px] overflow-hidden rounded-[2rem] sm:min-h-[680px]">
            <Image alt="Neo KTNS premium navy piqué polo" className="object-cover object-center" fill priority sizes="(max-width: 1024px) 100vw, 52vw" src="/images/home/hero-polo.webp" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07131f]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-white sm:inset-x-8 sm:bottom-8"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/60">Studio mockup / Navy</p><p className="editorial mt-2 text-2xl">Premium Piqué 24s</p></div><span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.1em] backdrop-blur">Preorder</span></div>
          </div>

          <div className="lg:pl-6">
            <p className="eyebrow">The Essential / 01</p>
            <h1 className="editorial mt-5 text-balance text-5xl font-semibold leading-[.98] sm:text-6xl">{product.name}</h1>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-muted">{product.nameEn}</p>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted">{product.description}</p>
            <div className="mt-7 flex items-end gap-3"><span className="text-xs text-muted">Mulai dari</span><strong className="editorial text-3xl">{formatRupiah(startingPrice)}</strong></div>

            <dl className="mt-8 grid gap-3 border-y border-[var(--border)] py-6 sm:grid-cols-2">
              {[["Material", product.material], ["Weight", product.weight], ["Feel", "Medium–tebal, structured feel"], ["Production", `Preorder · minimum ${product.productionDays} hari`]].map(([label, value]) => <div key={label}><dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}
            </dl>

            <div className="mt-7"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted">{colors.length} available colors</p><div className="mt-3 flex flex-wrap gap-2">{colors.map((color) => <span className="piqué-swatch size-9 rounded-full border-2 border-[var(--surface)] shadow-[0_0_0_1px_var(--border)]" key={color.slug} style={{ backgroundColor: color.hex }} title={`${color.name} / ${color.nameEn}`} />)}</div></div>

            <div className="mt-8 grid gap-2 text-xs sm:grid-cols-2"><p className="flex items-center gap-2"><Check className="text-copper" size={15} />No minimum order</p><p className="flex items-center gap-2"><Clock3 className="text-copper" size={15} />Minimum {product.productionDays} days</p><p className="flex items-center gap-2"><Scissors className="text-copper" size={15} />Embroidery-ready</p><p className="flex items-center gap-2"><ShieldCheck className="text-copper" size={15} />Defect guarantee</p></div>
            <ButtonLink className="mt-9" href="#configurator">Configure yours <ArrowDown className="ml-2" size={17} /></ButtonLink>
          </div>
        </section>
      </Container>

      <section className="border-t border-[var(--border)] bg-[color:var(--surface)]/45 py-16 sm:py-24" id="configurator">
        <Container>
          <div className="mb-10 max-w-3xl sm:mb-14"><p className="eyebrow">Product configurator</p><h2 className="editorial mt-4 text-balance text-4xl sm:text-6xl">Configure clearly. Order together.</h2><p className="mt-5 text-sm leading-7 text-muted">Pilih posisi bordir secara langsung, lalu sistem menentukan paket produksi dan estimasi harga. Ulangi untuk warna atau ukuran lain dalam satu order.</p></div>
          <CustomBuilder catalog={catalog} />
        </Container>
      </section>

      <ProductSupportInfo productionDays={settings.productionDaysMin} minimumDpPercentage={settings.minimumDpPercentage} returnPolicy={settings.returnPolicyShort} />
    </main>
  );
}
