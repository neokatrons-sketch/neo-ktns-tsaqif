import type { LucideIcon } from "lucide-react";

export function AdminMetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return <article className="surface rounded-[var(--radius-md)] p-5"><div className="flex items-start justify-between"><p className="text-sm text-muted">{label}</p><span className="grid size-9 place-items-center rounded-full bg-[var(--background)] text-copper"><Icon size={17} /></span></div><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></article>;
}
