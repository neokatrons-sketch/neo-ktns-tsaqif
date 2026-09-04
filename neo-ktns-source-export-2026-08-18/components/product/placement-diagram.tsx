import type { CSSProperties } from "react";
import { placements, type PlacementCode } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const frontMarkers: ReadonlyArray<{ code: PlacementCode; className: string }> = [
  { code: "left-sleeve", className: "left-[7%] top-[29%]" },
  { code: "right-sleeve", className: "right-[7%] top-[29%]" },
  { code: "left-chest", className: "left-[56%] top-[35%]" },
  { code: "right-chest", className: "right-[56%] top-[35%]" },
];

function Marker({ code, active, available, className, motionIndex }: { code: PlacementCode; active: boolean; available: boolean; className: string; motionIndex?: number }) {
  const placement = placements.find((item) => item.code === code)!;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "placement-dot absolute z-10 grid size-6 place-items-center rounded-full border text-[8px] font-bold",
        className,
        active
          ? "border-copper bg-[var(--copper-action)] text-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--copper)_18%,transparent)]"
          : available
            ? "border-gold bg-[var(--surface)] text-copper"
            : "border-[var(--border)] bg-[var(--background)] text-muted opacity-35",
      )}
      data-stagger-item={motionIndex == null ? undefined : ""}
      style={motionIndex == null ? undefined : ({ "--stagger-index": motionIndex } as CSSProperties)}
      title={placement.label}
    >
      {placement.shortLabel}
    </span>
  );
}

export function PlacementDiagram({ active, available = active, compact = false, motion = false }: { active: readonly PlacementCode[]; available?: readonly PlacementCode[]; compact?: boolean; motion?: boolean }) {
  const activeSet = new Set(active);
  const availableSet = new Set(available);
  const activeLabel = active.map((code) => placements.find((item) => item.code === code)?.label).join(", ");

  return (
    <div aria-label={`Panduan posisi: ${activeLabel || "pilih posisi"}`} className={cn("placement-guide", compact && "placement-guide-compact")} data-stagger-group={motion ? "" : undefined} data-stagger-variant={motion ? "scale" : undefined} role="img" style={motion ? ({ "--stagger-step": "70ms" } as CSSProperties) : undefined}>
      <div className="placement-figure" data-stagger-item={motion ? "" : undefined} style={motion ? ({ "--stagger-index": 0 } as CSSProperties) : undefined}>
        <span className="placement-view-label">Front</span>
        <div className="placement-shirt">
          <span className="placement-collar" />
        </div>
        {frontMarkers.map((marker) => (
          <Marker active={activeSet.has(marker.code)} available={availableSet.has(marker.code)} className={marker.className} code={marker.code} key={marker.code} motionIndex={motion ? frontMarkers.indexOf(marker) + 2 : undefined} />
        ))}
      </div>
      <div className="placement-figure" data-stagger-item={motion ? "" : undefined} style={motion ? ({ "--stagger-index": 1 } as CSSProperties) : undefined}>
        <span className="placement-view-label">Back</span>
        <div className="placement-shirt placement-shirt-back" />
        <Marker active={activeSet.has("back")} available={availableSet.has("back")} className="left-1/2 top-[42%] -translate-x-1/2" code="back" motionIndex={motion ? 6 : undefined} />
      </div>
    </div>
  );
}
