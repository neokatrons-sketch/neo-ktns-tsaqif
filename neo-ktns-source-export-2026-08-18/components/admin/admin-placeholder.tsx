export function AdminPlaceholder({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <section className="mx-auto max-w-3xl py-10 sm:py-20"><p className="eyebrow">{eyebrow}</p><h1 className="editorial mt-4 text-4xl leading-tight sm:text-5xl">{title}</h1><div className="surface mt-7 rounded-[var(--radius-md)] p-6 sm:p-8"><p className="text-sm leading-7 text-muted">{detail}</p><p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-copper">Menunggu modul berikutnya</p></div></section>;
}
