import "server-only";

const EXPECTED_PUBLIC_ERROR = /^(Sesi|Nama|Nomor|Alamat|Tambahkan|Metode|Tautan|Catatan|Data|Format|Jumlah|Salah satu|Katalog|Harga|Kombinasi|Pesanan|Promo|Syarat|Unggah|File desain|Isi file|SVG aktif|Ukuran file)/i;

export function logUnexpectedServerFailure(route: string, error: unknown) {
  if (error instanceof Error && EXPECTED_PUBLIC_ERROR.test(error.message)) return;
  const record = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
  const rawCode = String(record.code ?? "");
  const code = /^[A-Z0-9_-]{1,40}$/i.test(rawCode) ? rawCode : undefined;
  console.error("[neo-ktns] server request failed", {
    route,
    category: error instanceof Error ? error.name : typeof error,
    ...(code ? { code } : {}),
  });
}
