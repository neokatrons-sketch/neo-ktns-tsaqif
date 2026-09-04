import type { OrderStatus } from "@/lib/orders/statuses";

const statusStyle: Record<OrderStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-600",
  "Menunggu Konfirmasi Admin": "border-amber-300 bg-amber-50 text-amber-800",
  "Menunggu Pembayaran": "border-orange-300 bg-orange-50 text-orange-800",
  "Menunggu Verifikasi Pembayaran": "border-yellow-300 bg-yellow-50 text-yellow-800",
  "Desain Diperiksa": "border-sky-300 bg-sky-50 text-sky-800",
  "Menunggu Persetujuan Desain": "border-blue-300 bg-blue-50 text-blue-800",
  "Masuk Produksi": "border-indigo-300 bg-indigo-50 text-indigo-800",
  "Quality Control": "border-violet-300 bg-violet-50 text-violet-800",
  "Siap Diambil": "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Siap Dikirim": "border-teal-300 bg-teal-50 text-teal-800",
  "Dalam Pengiriman": "border-cyan-300 bg-cyan-50 text-cyan-800",
  Selesai: "border-green-300 bg-green-50 text-green-800",
  "Ditolak Admin": "border-rose-300 bg-rose-50 text-rose-800",
  "Dibatalkan Admin": "border-red-300 bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4 ${statusStyle[status]}`}>
    {status}
  </span>;
}
