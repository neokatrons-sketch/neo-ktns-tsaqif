import { ArrowRight, MessageCircle, Palette, Scissors } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata = { title: "How to Custom" };

const steps = [
  {
    icon: Palette,
    number: "01",
    title: "Choose Color & Size",
    copy: "Pilih warna, ukuran, dan jumlah. Untuk pesanan kelompok, tambahkan kombinasi berbeda ke order yang sama.",
    detail: "7 warna · ukuran publik S–XL · tanpa minimum order",
  },
  {
    icon: Scissors,
    number: "02",
    title: "Choose Embroidery Placement",
    copy: "Pilih dada, lengan, atau belakang secara langsung. Sistem hanya menerima kombinasi produksi yang valid dan menentukan paket harga otomatis.",
    detail: "Dada/lengan maks. 7 × 7 cm · belakang maks. 26 × 14 cm",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Checkout via WhatsApp",
    copy: "Periksa order, unggah file desain, lalu kirim. Data tersimpan sebelum WhatsApp dibuka untuk konfirmasi admin.",
    detail: "PNG, JPG, PDF, SVG, PSD, EPS, CDR · maks. 10 MB",
  },
] as const;

export default function HowPage() {
  return (
    <main>
      <PageHero eyebrow="How it works / Three stages" title="From choice to embroidery." description="Alur dibuat ringkas agar kamu fokus pada polo dan lokasi bordir—bukan istilah paket produksi." />
      <Container className="py-16 sm:py-24">
        <ol className="border-y border-[var(--border)]">
          {steps.map(({ icon: Icon, number, title, copy, detail }) => (
            <li className="grid gap-6 border-b border-[var(--border)] py-8 last:border-b-0 md:grid-cols-[120px_.7fr_1.3fr] md:items-start md:gap-10 md:py-12" key={number}>
              <div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full border border-[var(--border)] text-copper"><Icon size={19} strokeWidth={1.7} /></span><span className="font-mono text-xs text-muted">{number}</span></div>
              <h2 className="editorial text-3xl leading-none sm:text-4xl">{title}</h2>
              <div><p className="text-base leading-8 text-muted">{copy}</p><p className="mt-4 text-xs font-semibold leading-6 text-copper">{detail}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-b border-[var(--border)] pb-14 sm:flex-row sm:items-center">
          <div><p className="eyebrow">Ready when you are</p><p className="editorial mt-3 text-3xl sm:text-4xl">Start with one clear choice.</p></div>
          <ButtonLink href="/custom">Start Custom <ArrowRight className="ml-2" size={17} /></ButtonLink>
        </div>
      </Container>
    </main>
  );
}
