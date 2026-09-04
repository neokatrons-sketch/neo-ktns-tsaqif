export const orderStatuses = [
  "Draft",
  "Menunggu Konfirmasi Admin",
  "Menunggu Pembayaran",
  "Menunggu Verifikasi Pembayaran",
  "Desain Diperiksa",
  "Menunggu Persetujuan Desain",
  "Masuk Produksi",
  "Quality Control",
  "Siap Diambil",
  "Siap Dikirim",
  "Dalam Pengiriman",
  "Selesai",
  "Ditolak Admin",
  "Dibatalkan Admin",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
