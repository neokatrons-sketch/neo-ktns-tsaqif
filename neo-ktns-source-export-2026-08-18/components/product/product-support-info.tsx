import { Ban, Clock3, FileImage, Percent, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";

export function ProductSupportInfo({ productionDays, minimumDpPercentage, returnPolicy }: { productionDays: number; minimumDpPercentage: number; returnPolicy: string }) {
  const policies = [
    [Clock3, `Minimum ${productionDays} hari`, "Produksi dimulai setelah desain dan pembayaran disetujui."],
    [Percent, `DP minimum ${minimumDpPercentage}%`, "Sisa pembayaran dan metode dibahas melalui admin."],
    [Ban, "Tidak dapat dibatalkan", "Custom order tidak dapat dibatalkan setelah checkout."],
    [ShieldCheck, "Defect guarantee", returnPolicy],
  ] as const;
  return (
    <section className="border-t border-[var(--border)] py-16 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <FileImage className="text-copper" size={24} />
            <p className="eyebrow mt-6">Design files / Checkout</p>
            <h2 className="editorial mt-3 text-3xl">Bring the clearest version.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Upload utama dilakukan saat checkout. PNG transparan lebih disarankan, tetapi file dengan background tetap dapat dikirim untuk diperiksa admin.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["PNG transparent · preferred", "JPG high-res", "PDF", "SVG", "PSD", "EPS", "CDR", "Canva link · optional", "Max 10 MB"].map((file) => <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[11px] font-semibold" key={file}>{file}</span>)}
            </div>
            <p className="mt-7 border-t border-[var(--border)] pt-5 text-xs leading-6 text-muted">Minor revisions are free before design approval. Perubahan besar setelah approval dapat memengaruhi waktu dan biaya.</p>
          </div>
          <div className="border-y border-[var(--border)]">
            {policies.map(([Icon, title, copy]) => <article className="grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--border)] py-5 last:border-b-0" key={title}><Icon className="mt-0.5 text-copper" size={19} /><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-6 text-muted">{copy}</p></div></article>)}
          </div>
        </div>
        <p className="mt-6 text-xs leading-6 text-muted"><strong className="text-[var(--foreground)]">Care / Perawatan:</strong> cuci dengan warna sejenis, balik polo sebelum mencuci, hindari pemutih, dan setrika suhu rendah pada area bordir.</p>
      </Container>
    </section>
  );
}
