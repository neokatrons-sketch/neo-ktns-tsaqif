import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const staggerStyle = (index: number) => ({ "--stagger-index": index } as CSSProperties);

export function SectionHeading({ eyebrow, title, description, align = "left", className, motion = false }: { eyebrow?: string; title: string; description?: string; align?: "left" | "center"; className?: string; motion?: boolean }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)} data-stagger-group={motion ? "" : undefined} style={motion ? ({ "--stagger-step": "90ms" } as CSSProperties) : undefined}>
      {eyebrow && <p className="eyebrow mb-4" data-stagger-item={motion ? "" : undefined} style={motion ? staggerStyle(0) : undefined}>{eyebrow}</p>}
      <h2 className="editorial text-balance text-4xl font-semibold leading-[.98] sm:text-5xl lg:text-[3.5rem]" data-stagger-item={motion ? "" : undefined} style={motion ? staggerStyle(1) : undefined}>{title}</h2>
      {description && <p className="mt-5 text-base leading-8 text-muted" data-stagger-item={motion ? "" : undefined} style={motion ? staggerStyle(2) : undefined}>{description}</p>}
    </div>
  );
}
