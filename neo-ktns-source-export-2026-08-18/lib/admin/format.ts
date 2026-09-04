export function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAdminDate(value: string | null | undefined, withTime = true) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function adminPaymentMethodLabel(value: string) {
  return value === "Konfirmasi Admin" ? "Konfirmasi admin" : value;
}

export function adminDeliveryMethodLabel(value: string) {
  if (value === "School Pickup") return "Ambil di sekolah";
  if (value === "Custom COD") return "COD / kurir";
  if (value === "Shipping") return "Pengiriman";
  return value;
}

export function placementLabel(value: string) {
  const labels: Record<string, string> = {
    chest_left: "Dada kiri",
    chest_right: "Dada kanan",
    back: "Belakang",
    sleeve_left: "Lengan kiri",
    sleeve_right: "Lengan kanan",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}
