import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ColorSwatch({ name, hex, selected = false, onClick }: { name: string; hex: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button aria-label={`Pilih warna ${name}`} aria-pressed={selected} className={cn("flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition", selected ? "border-copper bg-copper/8" : "border-[var(--border)] hover:border-gold")} onClick={onClick} type="button">
      <span className="grid size-7 place-items-center rounded-full border border-black/10" style={{ backgroundColor: hex }}>{selected && <Check className={hex === "#151617" || hex === "#152A43" || hex === "#641F2A" ? "text-white" : "text-navy"} size={13} />}</span>
      <span>{name}</span>
    </button>
  );
}
