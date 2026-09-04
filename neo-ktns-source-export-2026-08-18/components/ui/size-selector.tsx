import { cn } from "@/lib/utils";

export function SizeSelector({ sizes, selected, onChange }: { sizes: ReadonlyArray<string>; selected?: string; onChange?: (size: string) => void }) {
  return <div className="flex flex-wrap gap-2">{sizes.map((size) => <button aria-pressed={selected === size} className={cn("grid size-12 place-items-center rounded-xl border text-sm font-semibold transition", selected === size ? "border-copper bg-[var(--copper-action)] text-white" : "border-[var(--border)] bg-[var(--surface)] hover:border-gold")} key={size} onClick={() => onChange?.(size)} type="button">{size}</button>)}</div>;
}
