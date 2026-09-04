import { ArrowDownRight } from "lucide-react";
import Image from "next/image";

export function HeroProductVisual() {
  return (
    <div className="hero-product-stage relative isolate min-h-[430px] overflow-hidden rounded-[1.5rem] text-white shadow-[var(--shadow-soft)] sm:min-h-[620px] sm:rounded-[2rem] lg:min-h-[690px]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#19334d_0%,#0f2238_54%,#07131f_100%)]" />
      <div className="piqué-overlay absolute inset-0 opacity-35" />

      <div className="absolute inset-x-6 top-6 z-20 flex items-start justify-between gap-4 sm:inset-x-8 sm:top-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/55">The Essential / 01</p>
          <p className="mt-2 text-xs text-white/80">Premium Piqué 24s</p>
        </div>
        <span className="rounded-full border border-white/20 bg-white/[.06] px-3 py-1.5 text-[10px] uppercase tracking-[.15em] text-white/70 backdrop-blur-sm">200–220 gsm</span>
      </div>

      <Image
        alt="Polo bordir premium Neo KTNS berwarna navy"
        className="hero-polo-image absolute inset-0 z-10 size-full object-cover object-center"
        height={1402}
        priority
        sizes="(min-width: 1024px) 47vw, 90vw"
        src="/images/home/hero-polo.webp"
        unoptimized
        width={1122}
      />
      <div className="absolute inset-0 z-[15] bg-gradient-to-b from-[#07131f]/20 via-transparent to-[#07131f]/75" />

      <div className="absolute bottom-6 left-6 z-20 sm:bottom-8 sm:left-8">
        <div className="mb-4 h-px w-24 stitch-line opacity-55" />
        <p className="editorial text-3xl sm:text-4xl">Made to represent.</p>
        <p className="mt-2 max-w-[24rem] text-xs leading-5 text-white/60">Premium texture. Clear choices. Personal embroidery.</p>
      </div>
      <div className="absolute bottom-6 right-6 z-20 hidden sm:block sm:bottom-8 sm:right-8">
        <ArrowDownRight className="text-[#d5b787]" size={28} strokeWidth={1.3} />
      </div>
    </div>
  );
}
