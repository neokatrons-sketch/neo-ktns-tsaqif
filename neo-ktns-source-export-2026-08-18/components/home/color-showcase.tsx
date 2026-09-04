"use client";

import { Check, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useState } from "react";
import { colors } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function ColorShowcase() {
  const [selected, setSelected] = useState(4);
  const color = colors[selected];

  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[1.35fr_.65fr]">
      <div className="group/color relative min-h-[370px] overflow-hidden bg-[#eae5da] sm:min-h-[540px]">
        <Image
          alt="Tujuh pilihan warna polo Neo KTNS: putih, hitam, maroon, merah cabe, navy, hijau army, dan abu tua"
          className="absolute inset-0 size-full object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover/color:-translate-y-[3px] motion-safe:group-hover/color:scale-[1.005]"
          height={1024}
          sizes="(min-width: 1024px) 65vw, 100vw"
          src="/images/home/color-polos.webp"
          unoptimized
          width={1536}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f2238]/65 to-transparent p-6 pt-24 text-white sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/65">Seven considered tones</p>
          <p className="editorial mt-2 text-3xl sm:text-4xl">A palette for every identity.</p>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <div>
          <p className="eyebrow">Color library / Pilihan warna</p>
          <h3 className="editorial mt-4 text-4xl leading-none">{color.name}</h3>
          <p className="mt-2 text-sm text-muted">{color.nameEn} · Available for preorder</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2" data-stagger-group style={{ "--stagger-step": "55ms" } as CSSProperties}>
          {colors.map((item, index) => (
            <button
              aria-label={`Pilih warna ${item.name}`}
              aria-pressed={selected === index}
              className={cn(
                "group flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left text-xs font-medium transition",
                selected === index ? "border-copper bg-[var(--background)]" : "border-[var(--border)] hover:border-gold",
              )}
              data-stagger-item
              key={item.slug}
              onClick={() => setSelected(index)}
              style={{ "--stagger-index": index } as CSSProperties}
              type="button"
            >
              <span className="relative grid size-7 shrink-0 place-items-center rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: item.hex }}>
                {selected === index && <Check className={item.slug === "white" ? "text-navy" : "text-white"} size={13} strokeWidth={2.4} />}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="block h-2 flex-1 rounded-full piqué-swatch" style={{ backgroundColor: color.hex }} />
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted">{color.hex}</span>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-copper transition hover:gap-3" href="/custom">
            Custom this color <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
