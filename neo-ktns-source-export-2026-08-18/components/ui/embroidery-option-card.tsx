import { Check } from "lucide-react";
import { PlacementDiagram } from "@/components/product/placement-diagram";
import type { PlacementCode } from "@/lib/catalog";
import { cn, formatRupiah } from "@/lib/utils";

export function EmbroideryOptionCard({
  name,
  nameEn,
  summary,
  maxSize,
  placementRule,
  price,
  diagramPositions,
  availablePositions,
  selected = false,
  onClick,
}: {
  name: string;
  nameEn: string;
  summary: string;
  maxSize: string;
  placementRule: string;
  price: number;
  diagramPositions: readonly PlacementCode[];
  availablePositions: readonly PlacementCode[];
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "group flex min-h-[250px] w-full flex-col rounded-[var(--radius-md)] border p-4 text-left transition duration-200 sm:p-5",
        selected
          ? "border-copper bg-[color:var(--copper)]/7 shadow-[0_16px_40px_rgba(181,106,60,.10)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:-translate-y-0.5 hover:border-gold",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold">{name}</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{nameEn}</span>
        </span>
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", selected ? "border-copper bg-[var(--copper-action)] text-white" : "border-[var(--border)]")}>
          {selected && <Check size={13} />}
        </span>
      </span>
      <span className="mt-4 block text-xs leading-5 text-muted">{summary}</span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-semibold text-muted">{placementRule}</span>
        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-semibold text-muted">{maxSize}</span>
      </span>
      <span className="mt-auto flex w-full items-end justify-between gap-3 pt-4">
        <PlacementDiagram active={diagramPositions} available={availablePositions} compact />
        <span className="shrink-0 text-right">
          <span className="block text-[10px] uppercase tracking-[.12em] text-muted">Est. / unit</span>
          <strong className="mt-1 block text-sm">{formatRupiah(price)}</strong>
        </span>
      </span>
    </button>
  );
}
