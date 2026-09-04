import { cn } from "@/lib/utils";

export function FormField({ label, hint, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id ?? props.name;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return <label className="block" htmlFor={id}><span className="mb-2 block text-sm font-medium">{label}</span><input aria-describedby={describedBy} aria-invalid={Boolean(error)} className={cn("min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-base outline-none transition placeholder:text-muted/70 focus:border-copper", className)} id={id} {...props} />{(error || hint) && <span className={cn("mt-2 block text-xs", error ? "text-[var(--danger)]" : "text-muted")} id={describedBy} role={error ? "alert" : undefined}>{error ?? hint}</span>}</label>;
}
