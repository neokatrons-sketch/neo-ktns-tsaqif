import { ArrowRight, Check, MapPinned, Palette, Scissors, Shirt } from "lucide-react";
import Image from "next/image";
import { PlacementDiagram } from "@/components/product/placement-diagram";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { colors, placements, type PlacementCode } from "@/lib/catalog";
import { publicPriceKey } from "@/lib/public-pricing";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";
import { formatRupiah } from "@/lib/utils";

export const metadata = { title: "Collection — Premium Custom Polo" };

const highlights = [
  [Shirt, "Premium Piqué 24s", "Structured, medium–thick feel"],
  [Palette, "7 refined colors", "From off-white to deep navy"],
  [MapPinned, "5 direct placements", "Chest, sleeves, and back"],
] as const;

const placementCodes = placements.map((placement) => placement.code) as PlacementCode[];

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const catalog = await getPublicConfiguratorCatalog().catch(() => null);
  const startingPrice = catalog?.prices[publicPriceKey("one-point", "S")] ?? null;

  return (
    <main>
      <Container className="py-10 sm:py-16 lg:py-20">
        <section className="grid gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Collection / The Essential 01</p>
            <h1 className="editorial mt-5 text-balance text-5xl font-semibold leading-[.96] sm:text-6xl lg:text-7xl">One polo.<br /><span className="text-copper">Built around you.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted">Satu fondasi premium untuk identitas personal, kelas, komunitas, dan organisasi. Setiap detail—warna, ukuran, hingga posisi bordir—dikonfigurasi untuk pesananmu.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><ButtonLink href="/products/premium-polo#configurator"><Scissors className="mr-2" size={17} />Start Custom</ButtonLink><span className="px-2 text-sm text-muted">{startingPrice == null ? "Harga tersedia di configurator" : `Mulai ${formatRupiah(startingPrice)}`}</span></div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted"><Check className="text-copper" size={14} />No minimum order · preorder custom production</p>
          </div>

          <div className="product-canvas piqué-texture relative min-h-[500px] overflow-hidden rounded-[2rem] sm:min-h-[620px]">
            <Image alt="Premium navy Neo KTNS polo shirt" className="object-cover object-center" fill priority sizes="(max-width: 1024px) 100vw, 56vw" src="/images/home/hero-polo.webp" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07131f]/80 via-transparent to-[#0f2238]/10" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-5 text-white sm:inset-x-8 sm:bottom-8">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/60">Premium short sleeve polo</p><p className="editorial mt-2 text-3xl">The Essential / 01</p></div>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] backdrop-blur-sm">200–220 gsm</span>
            </div>
          </div>
        </section>
      </Container>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <Container className="grid divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {highlights.map(([Icon, title, copy]) => <article className="flex items-center gap-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0" key={title}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--background)]"><Icon className="text-copper" size={19} /></span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted">{copy}</p></div></article>)}
        </Container>
      </section>

      <Container className="py-16 sm:py-24">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
            <Image alt="Seven available Neo KTNS polo colors" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 55vw" src="/images/home/color-polos.webp" unoptimized />
          </div>
          <div className="lg:pl-8">
            <p className="eyebrow">Color study / 07</p>
            <h2 className="editorial mt-4 text-4xl sm:text-5xl">A tone for every identity.</h2>
            <p className="mt-5 text-sm leading-7 text-muted">Tujuh warna inti dipilih agar logo komunitas tetap terbaca sekaligus menjaga karakter polo tetap refined.</p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {colors.map((color) => <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3" key={color.slug}><span className="piqué-swatch size-7 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} /><span className="text-xs font-semibold">{color.name}</span><span className="ml-auto text-[10px] text-muted">{color.nameEn}</span></div>)}
            </div>
          </div>
        </section>
      </Container>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Direct embroidery placement</p>
            <h2 className="editorial mt-4 text-4xl leading-[.98] sm:text-5xl">Choose the location, not the package.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted">Dada kiri, dada kanan, lengan kiri, lengan kanan, atau belakang. Sistem memetakan kombinasi valid ke paket dan harga produksi yang sudah ada.</p>
            <div className="mt-7 flex flex-wrap gap-2">{placements.map((placement) => <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold" key={placement.code}>{placement.label}</span>)}</div>
            <ButtonLink className="mt-8" href="/products/premium-polo#configurator">Configure the polo <ArrowRight className="ml-2" size={17} /></ButtonLink>
          </div>
          <div className="placement-stage rounded-[2rem] border border-[var(--border)] p-6 sm:p-10"><PlacementDiagram active={[]} available={placementCodes} /></div>
        </Container>
      </section>

      <Container className="py-16 text-center sm:py-24">
        <p className="eyebrow">Neo KTNS / Custom made</p>
        <h2 className="editorial mx-auto mt-4 max-w-3xl text-balance text-4xl sm:text-6xl">One product. Every detail considered.</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted">Bukan katalog yang ramai—hanya satu polo premium yang dibangun dengan tepat untuk identitasmu.</p>
        <ButtonLink className="mt-8" href="/products/premium-polo#configurator"><Scissors className="mr-2" size={17} />Start Custom</ButtonLink>
      </Container>
    </main>
  );
}
