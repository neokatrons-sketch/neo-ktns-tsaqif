import Image from "next/image";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata = { title: "Our Story" };

export default function StoryPage() {
  return (
    <main>
      <PageHero eyebrow="Neo KTNS / Our Story" title="Made for identities in motion." description="Neo KTNS lahir dari gagasan sederhana: pakaian kelompok tidak harus terasa massal." />
      <Container className="py-16 sm:py-24">
        <section className="grid gap-12 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div>
            <p className="editorial text-balance text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">Digital precision meets the patience of craftsmanship.</p>
            <div className="mt-8 space-y-5 text-base leading-8 text-muted">
              <p>Kami menggabungkan proses pemesanan yang terstruktur dengan karakter bordir yang personal. Setiap titik bukan sekadar dekorasi, melainkan cara sebuah kelas, komunitas, atau organisasi memperlihatkan siapa mereka.</p>
              <p>Karena itu, Neo KTNS dibangun dengan pendekatan yang tenang: material yang dijelaskan apa adanya, konfigurasi yang mudah dipahami, dan komunikasi langsung sebelum produksi.</p>
            </div>
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-[2rem] border border-[var(--border)]">
            <Image alt="Kain piqué navy, jarum, dan benang warm copper sebagai simbol presisi dan craftsmanship" className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 56vw" src="/images/home/story-precision-craft.webp" />
          </div>
        </section>

        <section className="mt-20 border-y border-[var(--border)] sm:mt-28">
          {[
            ["Clarity", "Pilihan produk, posisi bordir, dan estimasi dibuat mudah dipahami sejak awal."],
            ["Intention", "Setiap warna dan lokasi dipilih karena memiliki tujuan, bukan sekadar menambah variasi."],
            ["Craft", "Tekstur, jahitan, dan hasil akhir mendapat perhatian yang sama dengan pengalaman memesan."],
          ].map(([title, copy], index) => (
            <article className="grid gap-3 border-b border-[var(--border)] py-7 last:border-b-0 sm:grid-cols-[120px_1fr] sm:gap-10 sm:py-9" key={title}>
              <p className="font-mono text-[10px] text-muted">0{index + 1}</p>
              <div><h2 className="text-base font-semibold">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{copy}</p></div>
            </article>
          ))}
        </section>
      </Container>
    </main>
  );
}
