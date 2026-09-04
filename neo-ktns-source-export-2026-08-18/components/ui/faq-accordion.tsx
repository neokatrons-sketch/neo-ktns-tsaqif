"use client";

import { ChevronDown } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items, motion = false }: { items: ReadonlyArray<{ question: string; answer: string }>; motion?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]" data-stagger-group={motion ? "" : undefined} style={motion ? ({ "--stagger-step": "65ms" } as CSSProperties) : undefined}>{items.map((item, index) => (
    <div data-stagger-item={motion ? "" : undefined} key={item.question} style={motion ? ({ "--stagger-index": index } as CSSProperties) : undefined}>
      <button aria-expanded={open === index} className="flex w-full items-center justify-between gap-5 py-5 text-left font-medium" onClick={() => setOpen(open === index ? null : index)} type="button">
        {item.question}<ChevronDown className={cn("shrink-0 transition-transform duration-250", open === index && "rotate-180")} size={18} />
      </button>
      {motion ? <div aria-hidden={open !== index} className={cn("grid transition-[grid-template-rows,opacity] duration-250 ease-out", open === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="overflow-hidden"><p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-muted">{item.answer}</p></div></div> : open === index && <p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-muted">{item.answer}</p>}
    </div>
  ))}</div>;
}
