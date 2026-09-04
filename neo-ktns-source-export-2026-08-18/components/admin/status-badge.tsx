import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  "Menunggu Konfirmasi Admin": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Masuk Produksi": "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Quality Control": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Selesai": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Dibatalkan Admin": "bg-red-500/10 text-red-700 dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles[status] ?? "bg-slate-500/10 text-muted")}>{status}</span>;
}
