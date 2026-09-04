import "server-only";

import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type BusinessOption = {
  value: string;
  label: string;
  enabled: boolean;
  helper: string;
};

export type BusinessSettings = {
  whatsappNumber: string;
  minimumDpPercentage: number;
  paymentDeadlineHours: number;
  productionDaysMin: number;
  paymentMethods: BusinessOption[];
  deliveryMethods: BusinessOption[];
  qrisInformation: string;
  preorderNotice: string;
  returnPolicyShort: string;
  pickupNotice: string;
};

const PAYMENT_VALUES = ["QRIS", "Cash", "Konfirmasi dengan admin"] as const;
const DELIVERY_VALUES = ["Ambil di sekolah", "COD / kurir", "Pengiriman, ongkir dikonfirmasi admin"] as const;

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  whatsappNumber: "6285725935431",
  minimumDpPercentage: 50,
  paymentDeadlineHours: 24,
  productionDaysMin: 15,
  paymentMethods: [
    { value: "QRIS", label: "QRIS", enabled: true, helper: "" },
    { value: "Cash", label: "Cash", enabled: true, helper: "" },
    { value: "Konfirmasi dengan admin", label: "Konfirmasi dengan admin", enabled: true, helper: "" },
  ],
  deliveryMethods: [
    { value: "Ambil di sekolah", label: "Ambil di sekolah", enabled: true, helper: "Lokasi dan waktu dikonfirmasi admin." },
    { value: "COD / kurir", label: "COD / kurir", enabled: true, helper: "Biaya dan titik temu dikonfirmasi admin." },
    { value: "Pengiriman, ongkir dikonfirmasi admin", label: "Pengiriman", enabled: true, helper: "Ongkir dikonfirmasi admin." },
  ],
  qrisInformation: "",
  preorderNotice: "Produk menggunakan sistem preorder.",
  returnPolicyShort: "Produk custom tidak dapat dibatalkan atau dikembalikan kecuali terdapat cacat atau kesalahan produksi.",
  pickupNotice: "Lokasi dan waktu pengambilan dikonfirmasi admin.",
};

const SETTING_KEYS = [
  "whatsapp_number",
  "minimum_dp_percentage",
  "payment_deadline_hours",
  "production_days_min",
  "payment_methods",
  "delivery_methods",
  "qris_information",
  "preorder_notice",
  "return_policy_short",
  "pickup_notice",
];

let memoryCache: { expiresAt: number; value: BusinessSettings } | null = null;

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function asText(value: unknown, fallback: string, max = 1_000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function normaliseWhatsapp(value: unknown) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return /^62[0-9]{8,14}$/.test(digits) ? digits : DEFAULT_BUSINESS_SETTINGS.whatsappNumber;
}

function parseOptions(value: unknown, defaults: BusinessOption[], allowed: readonly string[]) {
  const rows = Array.isArray(value) ? value : [];
  const byValue = new Map(rows.map((row) => {
    const record = typeof row === "object" && row !== null ? row as Record<string, unknown> : {};
    return [String(record.value ?? ""), record];
  }));
  return defaults.map((fallback) => {
    const row = byValue.get(fallback.value);
    if (!row || !allowed.includes(fallback.value)) return { ...fallback };
    return {
      value: fallback.value,
      label: asText(row.label, fallback.label, 80),
      enabled: typeof row.enabled === "boolean" ? row.enabled : fallback.enabled,
      helper: typeof row.helper === "string" ? row.helper.trim().slice(0, 240) : fallback.helper,
    };
  });
}

export function clearBusinessSettingsCache() {
  memoryCache = null;
}

export async function getBusinessSettings(options: { fresh?: boolean } = {}): Promise<BusinessSettings> {
  if (!options.fresh && memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache.value;
  try {
    const supabase = await createServiceSupabaseClient();
    const { data, error } = await supabase.from("settings").select("key,value").in("key", SETTING_KEYS);
    if (error) throw error;
    const values = new Map((data ?? []).map((row) => [row.key, row.value]));
    const settings: BusinessSettings = {
      whatsappNumber: normaliseWhatsapp(values.get("whatsapp_number")),
      minimumDpPercentage: asNumber(values.get("minimum_dp_percentage"), 50, 0, 100),
      paymentDeadlineHours: asNumber(values.get("payment_deadline_hours"), 24, 1, 720),
      productionDaysMin: asNumber(values.get("production_days_min"), 15, 1, 365),
      paymentMethods: parseOptions(values.get("payment_methods"), DEFAULT_BUSINESS_SETTINGS.paymentMethods, PAYMENT_VALUES),
      deliveryMethods: parseOptions(values.get("delivery_methods"), DEFAULT_BUSINESS_SETTINGS.deliveryMethods, DELIVERY_VALUES),
      qrisInformation: typeof values.get("qris_information") === "string" ? String(values.get("qris_information")).slice(0, 500) : "",
      preorderNotice: asText(values.get("preorder_notice"), DEFAULT_BUSINESS_SETTINGS.preorderNotice),
      returnPolicyShort: asText(values.get("return_policy_short"), DEFAULT_BUSINESS_SETTINGS.returnPolicyShort),
      pickupNotice: asText(values.get("pickup_notice"), DEFAULT_BUSINESS_SETTINGS.pickupNotice),
    };
    memoryCache = { expiresAt: Date.now() + 60_000, value: settings };
    return settings;
  } catch {
    return {
      ...DEFAULT_BUSINESS_SETTINGS,
      paymentMethods: DEFAULT_BUSINESS_SETTINGS.paymentMethods.map((item) => ({ ...item })),
      deliveryMethods: DEFAULT_BUSINESS_SETTINGS.deliveryMethods.map((item) => ({ ...item })),
    };
  }
}

export function isPaymentMethodEnabled(settings: BusinessSettings, value: string) {
  return settings.paymentMethods.some((option) => option.value === value && option.enabled);
}

export function isDeliveryMethodEnabled(settings: BusinessSettings, value: string) {
  return settings.deliveryMethods.some((option) => option.value === value && option.enabled);
}
