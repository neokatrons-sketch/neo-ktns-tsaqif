import { formatRupiah } from "@/lib/utils";

export function OrderSummary({ rows, total }: { rows: Array<{ label: string; value: string }>; total: number }) {
  return (
    <aside className="surface rounded-[var(--radius-lg)] p-5 sm:p-6">
      <h2 className="font-semibold">Order summary</h2>
      <dl className="mt-5 space-y-3 border-b border-[var(--border)] pb-5">{rows.map((row) => <div className="flex justify-between gap-4 text-sm" key={row.label}><dt className="text-muted">{row.label}</dt><dd className="text-right font-medium">{row.value}</dd></div>)}</dl>
      <div className="mt-5 flex items-end justify-between gap-4"><span className="text-sm text-muted">Harga sementara</span><strong className="editorial text-3xl">{formatRupiah(total)}</strong></div>
      <p className="mt-3 text-xs leading-5 text-muted">Ongkir dan total final akan dikonfirmasi admin melalui WhatsApp.</p>
    </aside>
  );
}
