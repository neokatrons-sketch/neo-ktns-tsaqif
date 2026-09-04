import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  CircleDot,
  MessageCircle,
  Palette,
  Ruler,
  Scissors,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { ColorShowcase } from "@/components/home/color-showcase";
import { HeroProductVisual } from "@/components/home/hero-product-visual";
import { HomeMotion } from "@/components/motion/home-motion";
import { Reveal } from "@/components/motion/reveal";
import { PlacementDiagram } from "@/components/product/placement-diagram";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { placements, sizes, type PlacementCode } from "@/lib/catalog";
import { publicPriceKey } from "@/lib/public-pricing";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";
import { formatRupiah } from "@/lib/utils";
import { getBusinessSettings } from "@/lib/business-settings";

const processSteps = [
  {
    icon: Palette,
    number: "01",
    title: "Choose Color & Size",
    copy: "Pilih warna polo, ukuran, dan jumlah untuk setiap anggota.",
  },
  {
    icon: Scissors,
    number: "02",
    title: "Choose Embroidery Placement",
    copy: "Tentukan lokasi bordir langsung. Paket dan estimasi harga dipetakan otomatis.",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Checkout via WhatsApp",
    copy: "Unggah desain, simpan pesanan, lalu konfirmasi detail akhir bersama admin.",
  },
] as const;

const homeFaqs = [
  { question: "Can I order one piece? / Apakah bisa pesan satuan?", answer: "Bisa. Neo KTNS tidak menerapkan minimum order—kamu dapat memesan satu polo atau mengatur pesanan kelompok dalam satu checkout." },
  { question: "Is there a defect guarantee? / Apakah ada garansi cacat?", answer: "Ada. Produk custom tidak dapat dikembalikan kecuali terdapat cacat atau kesalahan produksi dari pihak Neo KTNS." },
  { question: "What material is used? / Bahan apa yang digunakan?", answer: "Premium Piqué 24s dengan bobot 200–220 gsm dan karakter medium hingga tebal yang rapi serta embroidery-ready." },
  { question: "How do I choose the right size? / Bagaimana memilih ukuran?", answer: "Ukur polo yang paling nyaman kamu gunakan, lalu bandingkan panjang dan lingkar dadanya dengan panduan ukuran S–XL kami." },
  { question: "What is the maximum embroidery size? / Berapa ukuran maksimal bordir?", answer: "Posisi dada dan lengan maksimal 7 × 7 cm. Bordir punggung maksimal 26 × 14 cm." },
  { question: "How long does production take? / Berapa lama pengerjaannya?", answer: "Minimum 15 hari setelah desain dan pembayaran dikonfirmasi. Jumlah besar atau perubahan mayor dapat memengaruhi timeline." },
];

const placementCodes = placements.map((placement) => placement.code) as PlacementCode[];
const entryStyle = (delay: number, duration = 650, distance = 18) => ({
  "--motion-delay": `${delay}ms`,
  "--motion-distance": `${distance}px`,
  "--motion-duration": `${duration}ms`,
} as CSSProperties);
const staggerStyle = (index: number) => ({ "--stagger-index": index } as CSSProperties);

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, catalog] = await Promise.all([
    getBusinessSettings(),
    getPublicConfiguratorCatalog().catch(() => null),
  ]);
  const startingPrice = catalog?.prices[publicPriceKey("one-point", "S")] ?? null;
  const publicSizes = sizes.filter((size) => size.public);
  const currentFaqs = homeFaqs.map((item) =>
    item.question.startsWith("Is there a defect guarantee")
      ? { ...item, answer: settings.returnPolicyShort }
      : item.question.startsWith("How long does production")
        ? { ...item, answer: `Minimum ${settings.productionDaysMin} hari setelah desain dan pembayaran dikonfirmasi. Jumlah besar atau perubahan mayor dapat memengaruhi timeline.` }
        : item,
  );

  return (
    <main className="home-motion-root">
      <HomeMotion />
      <section className="hero-section relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
          <div className="lg:py-8">
            <p className="eyebrow" data-home-entry style={entryStyle(90, 580, 14)}>Premium custom polo / Neo KTNS</p>
            <h1 className="editorial text-balance mt-6 max-w-[10ch] text-[clamp(3.35rem,16vw,4.25rem)] font-semibold leading-[.82] tracking-[-.045em] sm:text-[6rem] lg:text-[7.4rem]" data-home-entry style={entryStyle(180, 720, 18)}>
              Precision,<br /><span className="text-copper">stitched.</span>
            </h1>
            <p className="mt-8 max-w-[35rem] text-base leading-8 text-muted sm:text-lg" data-home-entry style={entryStyle(270, 620, 16)}>
              Polo bordir premium untuk pelajar, komunitas, dan organisasi.
              <span className="text-[var(--foreground)]"> Dibuat personal, diproses dengan jelas.</span>
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row" data-home-entry style={entryStyle(350, 600, 14)}>
              <ButtonLink className="home-action min-h-12 px-6" href="/custom">Start Custom <ArrowRight className="ml-2" size={17} /></ButtonLink>
              <ButtonLink className="home-action min-h-12 px-6" href="/collection" variant="secondary">Explore Collection</ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 border-y border-[var(--border)] py-5" data-home-entry style={entryStyle(430, 580, 12)}>
              <div><dt className="editorial text-2xl">1 pcs</dt><dd className="mt-1 text-[10px] uppercase tracking-[.13em] text-muted">No minimum</dd></div>
              <div className="border-x border-[var(--border)] px-4 sm:px-6"><dt className="editorial text-2xl">7 tones</dt><dd className="mt-1 text-[10px] uppercase tracking-[.13em] text-muted">Curated colors</dd></div>
              <div className="pl-4 sm:pl-6"><dt className="editorial text-2xl">{settings.productionDaysMin}+ days</dt><dd className="mt-1 text-[10px] uppercase tracking-[.13em] text-muted">Made to order</dd></div>
            </dl>
          </div>
          <div data-home-entry data-motion-direction="none" data-motion-variant="scale" style={entryStyle(210, 840, 0)}><HeroProductVisual /></div>
        </Container>
      </section>

      <section className="py-20 sm:py-28 lg:py-32">
        <Container className="grid gap-14 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">The Essential / Product identity</p>
            <h2 className="editorial text-balance mt-5 max-w-xl text-5xl font-semibold leading-[.92] sm:text-6xl">
              One refined base. Every identity considered.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted">Satu polo berstruktur rapi yang dirancang sebagai kanvas untuk kelas, komunitas, organisasi, maupun identitas personal.</p>
          </Reveal>
          <Reveal delay={90}>
            <p className="border-b border-[var(--border)] pb-6 text-sm font-semibold">
              Starting from <span className="editorial ml-2 text-3xl text-copper">{startingPrice == null ? "Cek configurator" : formatRupiah(startingPrice)}</span>
            </p>
            <dl className="divide-y divide-[var(--border)]" data-stagger-group style={{ "--stagger-step": "80ms" } as CSSProperties}>
              {[
                ["Material", "Premium Piqué 24s"],
                ["Weight", "200–220 gsm"],
                ["Construction", "Plain, short sleeve, embroidery-ready"],
                ["Production", "Preorder after design approval"],
              ].map(([term, detail], index) => (
                <div className="grid grid-cols-[.42fr_.58fr] gap-5 py-5 text-sm" data-stagger-item key={term} style={staggerStyle(index)}>
                  <dt className="text-muted">{term}</dt><dd className="font-semibold">{detail}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-20 sm:py-28 lg:py-32">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <SectionHeading eyebrow="Color study / Tujuh pilihan" motion title="A tone for every identity." />
            <Reveal className="max-w-xl lg:justify-self-end" delay={90}><p className="text-base leading-8 text-muted">Putih, hitam, maroon, merah cabe, navy, hijau army, dan abu tua—ditampilkan sebagai koleksi warna, bukan grid marketplace.</p></Reveal>
          </div>
          <Reveal className="mt-12" duration={680} variant="scale"><ColorShowcase /></Reveal>
        </Container>
      </section>

      <section className="py-20 sm:py-28 lg:py-32" id="how-to-custom">
        <Container>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading description="Tidak perlu memahami paket produksi. Pilih yang terlihat pada polo; sistem menangani pemetaan harga." eyebrow="How to Custom / Tiga tahap" motion title="From choice to confirmation, clearly." />
            <Reveal delay={100}><ButtonLink className="home-action shrink-0" href="/how-to-custom" variant="secondary">View full process <ArrowRight className="ml-2" size={16} /></ButtonLink></Reveal>
          </div>
          <ol className="mt-14 border-y border-[var(--border)] lg:grid lg:grid-cols-3" data-stagger-group style={{ "--stagger-step": "120ms" } as CSSProperties}>
            {processSteps.map(({ icon: Icon, number, title, copy }, index) => (
              <li className="grid grid-cols-[auto_1fr] gap-5 border-b border-[var(--border)] py-7 last:border-b-0 lg:block lg:border-b-0 lg:border-r lg:px-8 lg:py-9 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0" data-stagger-item key={number} style={staggerStyle(index)}>
                <div className="flex items-center justify-between lg:mb-12">
                  <span className="grid size-11 place-items-center rounded-full border border-[var(--border)] text-copper"><Icon size={19} strokeWidth={1.7} /></span>
                  <span className="hidden font-mono text-[10px] text-muted lg:block">{number}</span>
                </div>
                <div><p className="font-mono text-[10px] text-muted lg:hidden">{number}</p><h3 className="mt-1 text-base font-semibold lg:mt-0">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">{copy}</p></div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-20 sm:py-28 lg:py-32">
        <Container className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div>
            <SectionHeading description="Pilih lokasi bordir langsung. Nama paket hanya muncul sebagai informasi sekunder setelah kombinasi valid." eyebrow="Direct placement / Posisi bordir" motion title="Choose the placement. We map the package." />
            <Reveal className="mt-8" delay={90}><div className="space-y-5">
              {[
                { group: "Depan", options: ["Dada Kiri", "Dada Kanan"] },
                { group: "Lengan", options: ["Lengan Kiri", "Lengan Kanan"] },
                { group: "Belakang", options: ["Belakang"] },
              ].map(({ group, options }) => (
                <div className="border-t border-[var(--border)] pt-4" key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">{group}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold" key={option}>{option}</span>)}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-6 text-muted">Dada dan lengan maks. 7 × 7 cm. Kombinasi yang tidak sesuai aturan produksi dicegah sebelum harga ditampilkan.</p>
            <ButtonLink className="home-action mt-8" href="/custom">Configure placement <ArrowRight className="ml-2" size={16} /></ButtonLink></Reveal>
          </div>
          <Reveal className="placement-stage min-h-[440px] rounded-[2rem] border border-[var(--border)] p-5 sm:min-h-[480px] sm:p-10" delay={100} duration={680} variant="scale">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 text-[10px] uppercase tracking-[.15em] text-muted"><span>Placement map</span><span>Front / Back</span></div>
            <div className="grid min-h-[360px] place-items-center sm:min-h-[400px]"><PlacementDiagram active={[]} available={placementCodes} motion /></div>
          </Reveal>
        </Container>
      </section>

      <section className="overflow-hidden bg-navy py-20 text-[#f6f4ef] sm:py-28 lg:py-32">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <Reveal className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-white/10" duration={720} variant="image">
            <Image alt="Detail tekstur piqué navy dan jahitan warm copper" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 56vw" src="/images/home/material-craftsmanship.webp" />
          </Reveal>
          <div data-stagger-group style={{ "--stagger-step": "90ms" } as CSSProperties}>
            <p className="eyebrow !text-[#d5b787]" data-stagger-item style={staggerStyle(0)}>Material & craftsmanship</p>
            <h2 className="editorial text-balance mt-5 text-5xl font-semibold leading-[.93] sm:text-6xl" data-stagger-item style={staggerStyle(1)}>Quality you can see up close.</h2>
            <p className="mt-7 text-base leading-8 text-white/65" data-stagger-item style={staggerStyle(2)}>Permukaan piqué yang taktil, bobot mantap, dan konstruksi bersih membentuk dasar yang stabil untuk bordir presisi.</p>
            <dl className="mt-9 grid grid-cols-2 border-y border-white/15" data-stagger-item style={staggerStyle(3)}>
              {[["24s", "Premium Piqué"], ["200–220", "gsm weight"], ["7 × 7", "cm chest / sleeve"], ["26 × 14", "cm back maximum"]].map(([value, label]) => (
                <div className="border-b border-white/15 py-5 odd:border-r odd:pr-5 even:pl-5 [&:nth-last-child(-n+2)]:border-b-0" key={label}>
                  <dt className="editorial text-3xl text-[#d5b787]">{value}</dt><dd className="mt-2 text-[10px] uppercase tracking-[.12em] text-white/45">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section className="border-b border-[var(--border)] py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[.68fr_1.32fr] lg:items-end">
            <div data-stagger-group style={{ "--stagger-step": "80ms" } as CSSProperties}><p className="eyebrow" data-stagger-item style={staggerStyle(0)}>Fit guide / Panduan ukuran</p><h2 className="editorial mt-4 text-5xl leading-none" data-stagger-item style={staggerStyle(1)}>Measured for confidence.</h2><p className="mt-5 text-sm leading-7 text-muted" data-stagger-item style={staggerStyle(2)}>Bandingkan dengan polo favoritmu sebelum memesan. Size guide publik tersedia dari S hingga XL.</p><div data-stagger-item style={staggerStyle(3)}><ButtonLink className="home-action mt-7" href="/size-guide" variant="secondary">Full Size Guide <Ruler className="ml-2" size={16} /></ButtonLink></div></div>
            <div className="grid grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4" data-stagger-group style={{ "--stagger-step": "70ms" } as CSSProperties}>
              {publicSizes.map((size, index) => <article className={`p-5 sm:p-6 ${index % 2 === 0 ? "border-r" : ""} border-[var(--border)] sm:border-r sm:last:border-r-0`} data-stagger-item key={size.code} style={staggerStyle(index)}><p className="editorial text-4xl text-copper">{size.code}</p><dl className="mt-7 space-y-3 text-xs"><div><dt className="text-muted">Length / Panjang</dt><dd className="mt-1 font-semibold">{size.length} cm</dd></div><div><dt className="text-muted">Chest / Lingkar dada</dt><dd className="mt-1 font-semibold">{size.chest} cm</dd></div></dl></article>)}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28 lg:py-32">
        <Container>
          <Reveal duration={680} variant="scale"><div className="grid overflow-hidden rounded-[2rem] bg-[var(--copper-action)] text-white lg:grid-cols-[1.08fr_.92fr]">
            <div className="p-7 sm:p-12 lg:p-14">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/70">Group order / Pesanan kelompok</p>
              <h2 className="editorial text-balance mt-5 max-w-xl text-5xl leading-[.95] sm:text-6xl">One order. Every person considered.</h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/80">Gabungkan banyak ukuran dan warna dalam satu pesanan—untuk kelas, kepanitiaan, organisasi, atau komunitas.</p>
              <ButtonLink className="home-action mt-8 bg-[#f6f4ef] text-navy hover:bg-white" href="/custom">Start Group Custom <UsersRound className="ml-2" size={17} /></ButtonLink>
            </div>
            <div className="border-t border-white/20 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <p className="text-sm font-semibold">Built for flexible coordination</p>
              <ul className="mt-8 space-y-5">
                {["Multiple colors and sizes", "Flexible quantity per configuration", "One secure checkout flow", "Admin-confirmed delivery and production"].map((item) => <li className="flex items-start gap-3 text-sm text-white/85" key={item}><Check className="mt-0.5 shrink-0" size={16} />{item}</li>)}
              </ul>
              <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/20 pt-7 text-center"><div><UsersRound className="mx-auto" size={18} /><p className="mt-2 text-[9px] uppercase tracking-[.12em] text-white/65">Classes</p></div><div><Boxes className="mx-auto" size={18} /><p className="mt-2 text-[9px] uppercase tracking-[.12em] text-white/65">Communities</p></div><div><BadgeCheck className="mx-auto" size={18} /><p className="mt-2 text-[9px] uppercase tracking-[.12em] text-white/65">Organizations</p></div></div>
            </div>
          </div></Reveal>
        </Container>
      </section>

      <section className="border-t border-[var(--border)] py-20 sm:py-28 lg:py-32">
        <Container className="grid gap-12 lg:grid-cols-[.68fr_1.32fr]">
          <div className="lg:sticky lg:top-28 lg:self-start"><SectionHeading description="Jawaban ringkas untuk material, ukuran, garansi, bordir, dan timeline produksi." eyebrow="FAQ / Before you order" motion title="Clear before we stitch." /><Reveal delay={100}><ButtonLink className="home-action mt-7" href="/faq" variant="secondary">See all questions</ButtonLink></Reveal></div>
          <FaqAccordion items={currentFaqs} motion />
        </Container>
      </section>

      <section className="pb-20 sm:pb-28">
        <Container>
          <Reveal duration={700} variant="scale"><div className="relative overflow-hidden rounded-[2rem] bg-navy px-7 py-14 text-[#f6f4ef] sm:px-12 sm:py-20 lg:px-16" data-stagger-group style={{ "--stagger-step": "90ms" } as CSSProperties}>
            <div className="piqué-overlay absolute inset-0 opacity-25" aria-hidden />
            <div className="relative max-w-4xl" data-stagger-item style={staggerStyle(0)}><p className="eyebrow !text-[#d5b787]">Ready to represent?</p><h2 className="editorial text-balance mt-5 text-5xl leading-[.9] sm:text-7xl">Make the identity wearable.</h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/65">Mulai dari satu polo. Pilih detailnya dengan jelas. Konfirmasi langsung bersama admin.</p></div>
            <div className="relative mt-10 flex flex-col gap-3 sm:flex-row" data-stagger-item style={staggerStyle(1)}><ButtonLink className="home-action home-final-primary relative min-h-12 overflow-hidden bg-[#f6f4ef] px-6 text-navy hover:bg-white" href="/custom">Start Custom <ArrowRight className="ml-2" size={17} /></ButtonLink><ButtonLink className="home-action min-h-12 border-white/20 bg-white/[.04] px-6 text-white hover:border-[#c5a46d]" href="/collection" variant="secondary">Explore Collection</ButtonLink></div>
            <div className="relative mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[.14em] text-white/50" data-stagger-item style={staggerStyle(2)}><span className="flex items-center gap-2"><CircleDot size={11} />No minimum order</span><span className="flex items-center gap-2"><CircleDot size={11} />Direct placement selection</span><span className="flex items-center gap-2"><CircleDot size={11} />Direct admin confirmation</span></div>
          </div></Reveal>
        </Container>
      </section>
    </main>
  );
}
