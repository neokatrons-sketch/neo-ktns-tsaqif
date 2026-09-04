import { PackageOpen } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="surface rounded-[var(--radius-lg)] px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--background)] text-copper"><PackageOpen size={21} /></span><h3 className="mt-5 font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}
