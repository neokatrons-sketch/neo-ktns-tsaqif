import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { colors, product } from "@/lib/catalog";
import { formatRupiah } from "@/lib/utils";

export function ProductCard({ startingPrice }: { startingPrice: number }) {
  return (
    <Link className="group surface overflow-hidden rounded-[var(--radius-lg)]" href="/products/premium-polo">
      <div className="product-canvas piqué-texture relative aspect-[4/3] overflow-hidden p-7 text-white">
        <span className="eyebrow !text-[#d5b787]">The Essential / 01</span>
        <div className="absolute inset-x-7 bottom-7 flex items-end justify-between gap-4">
          <p className="editorial max-w-[11ch] text-4xl leading-none">Premium Piqué 24s</p>
          <span className="grid size-11 place-items-center rounded-full border border-white/35 bg-white/10 transition group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight size={18} /></span>
        </div>
      </div>
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="font-semibold">{product.nameId}</h3><p className="mt-1 text-sm text-muted">Mulai {formatRupiah(startingPrice)}</p></div>
          <div className="flex -space-x-1.5" aria-label="7 warna tersedia">
            {colors.slice(0, 5).map((color) => <span className="size-5 rounded-full border-2 border-[var(--surface)]" key={color.slug} style={{ backgroundColor: color.hex }} />)}
          </div>
        </div>
      </div>
    </Link>
  );
}
