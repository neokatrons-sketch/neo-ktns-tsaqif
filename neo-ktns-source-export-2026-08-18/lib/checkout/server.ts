import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getServiceSupabaseConfig } from "@/lib/supabase/server-config";
import { getBusinessSettings, isDeliveryMethodEnabled, isPaymentMethodEnabled } from "@/lib/business-settings";

export const CHECKOUT_UPLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
export const MAX_CHECKOUT_JSON_BYTES = 128 * 1024;

export type CheckoutLineInput = {
  colorSlug: string;
  size: string;
  packageCode: string;
  placementCodes: string[];
  quantity: number;
};

export type CheckoutInput = {
  idempotencyKey: string;
  fullName: string;
  whatsappNumber: string;
  address: string;
  paymentMethod: string;
  deliveryMethod: string;
  canvaUrl?: string;
  customerNote?: string;
  items: CheckoutLineInput[];
};

type StoredItem = {
  product_id: string;
  product_color_id: string;
  product_size_id: string;
  embroidery_package_id: string;
  placement_codes: string[];
  quantity: number;
  unit_base_cost: number;
  unit_selling_price: number;
  line_total: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePlacementCodes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string"))].sort();
}

function samePlacements(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function parseAllowedSets(value: unknown) {
  return Array.isArray(value)
    ? value.map(normalizePlacementCodes).filter((set) => set.length > 0)
    : [];
}

function assertUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Sesi checkout tidak valid. Muat ulang halaman dan coba lagi.");
  }
}

export function assertCheckoutSession(orderId: string, idempotencyKey: string) {
  assertUuid(orderId);
  assertUuid(idempotencyKey);
}

function normaliseCanvaUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (raw.length > 2_000) throw new Error("Tautan Canva terlalu panjang.");
  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:" || (hostname !== "canva.com" && !hostname.endsWith(".canva.com"))) {
      throw new Error("INVALID_CANVA_URL");
    }
    return parsed.toString();
  } catch {
    throw new Error("Tautan Canva belum valid. Gunakan tautan https://www.canva.com/…");
  }
}

export async function readJsonRequest(request: Request, maximumBytes = MAX_CHECKOUT_JSON_BYTES) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error("Data permintaan terlalu besar.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maximumBytes) throw new Error("Data permintaan terlalu besar.");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Format data permintaan belum valid.");
  }
}

async function checkoutRecordId(scope: string, idempotencyKey: string) {
  assertUuid(idempotencyKey);
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`neo-ktns-checkout-${scope}:${idempotencyKey}`),
  ));
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function checkoutCustomerId(idempotencyKey: string) {
  return checkoutRecordId("customer", idempotencyKey);
}

export function checkoutOrderItemId(idempotencyKey: string, index: number) {
  return checkoutRecordId(`item-${index}`, idempotencyKey);
}

export function toPsychologicalPrice(value: number) {
  return Math.ceil((value + 100) / 10_000) * 10_000 - 100;
}

export function normalisePaymentMethod(value: string) {
  const map: Record<string, string> = {
    QRIS: "QRIS",
    Cash: "Cash",
    "Konfirmasi dengan admin": "Konfirmasi Admin",
    "Konfirmasi Admin": "Konfirmasi Admin",
  };
  if (!map[value]) throw new Error("Metode pembayaran belum valid.");
  return map[value];
}

export function normaliseDeliveryMethod(value: string) {
  const map: Record<string, string> = {
    "Ambil di sekolah": "School Pickup",
    "COD / kurir": "Custom COD",
    "Pengiriman, ongkir dikonfirmasi admin": "Shipping",
  };
  if (!map[value]) throw new Error("Metode penerimaan belum valid.");
  return map[value];
}

export function deliveryLabel(value: string) {
  return value === "School Pickup"
    ? "Ambil di sekolah"
    : value === "Custom COD"
      ? "COD / kurir"
      : "Pengiriman, ongkir dikonfirmasi admin";
}

export function paymentLabel(value: string) {
  return value === "Konfirmasi Admin" ? "Konfirmasi dengan admin" : value;
}

export function validateCheckoutInput(value: unknown): CheckoutInput {
  const input = asRecord(value);
  const fullName = String(input.fullName ?? "").trim();
  const whatsappNumber = String(input.whatsappNumber ?? "").replace(/[^0-9+]/g, "");
  const address = String(input.address ?? "").trim();
  const idempotencyKey = String(input.idempotencyKey ?? "");
  const items = Array.isArray(input.items) ? input.items.map((item) => asRecord(item)) : [];
  const customerNote = String(input.customerNote ?? "").trim();

  assertUuid(idempotencyKey);
  if (fullName.length < 2 || fullName.length > 120) throw new Error("Nama lengkap belum valid.");
  if (!/^\+?[0-9]{9,16}$/.test(whatsappNumber)) throw new Error("Nomor WhatsApp belum valid.");
  if (address.length < 8 || address.length > 1000) throw new Error("Alamat belum lengkap.");
  if (!items.length || items.length > 30) throw new Error("Tambahkan setidaknya satu item pesanan yang valid.");
  if (customerNote.length > 2_000) throw new Error("Catatan pesanan terlalu panjang.");

  return {
    idempotencyKey,
    fullName,
    whatsappNumber,
    address,
    paymentMethod: normalisePaymentMethod(String(input.paymentMethod ?? "")),
    deliveryMethod: normaliseDeliveryMethod(String(input.deliveryMethod ?? "")),
    canvaUrl: normaliseCanvaUrl(input.canvaUrl),
    customerNote: customerNote || undefined,
    items: items.map((item) => ({
      colorSlug: String(item.colorSlug ?? ""),
      size: String(item.size ?? ""),
      packageCode: String(item.packageCode ?? ""),
      placementCodes: normalizePlacementCodes(item.placementCodes),
      quantity: Number(item.quantity),
    })),
  };
}

export function validateCheckoutLines(value: unknown): CheckoutLineInput[] {
  const rows = Array.isArray(value) ? value : [];
  if (!rows.length || rows.length > 30) throw new Error("Tambahkan setidaknya satu item pesanan yang valid.");
  return rows.map((row) => {
    const item = asRecord(row);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) throw new Error("Jumlah pesanan belum valid.");
    return {
      colorSlug: String(item.colorSlug ?? ""),
      size: String(item.size ?? ""),
      packageCode: String(item.packageCode ?? ""),
      placementCodes: normalizePlacementCodes(item.placementCodes),
      quantity,
    };
  });
}

export async function assertCheckoutOptionsEnabled(input: Pick<CheckoutInput, "paymentMethod" | "deliveryMethod">) {
  const settings = await getBusinessSettings();
  const paymentValue = paymentLabel(input.paymentMethod);
  const deliveryValue = deliveryLabel(input.deliveryMethod);
  if (!isPaymentMethodEnabled(settings, paymentValue)) throw new Error("Metode pembayaran ini sedang tidak tersedia.");
  if (!isDeliveryMethodEnabled(settings, deliveryValue)) throw new Error("Metode penerimaan ini sedang tidak tersedia.");
  return settings;
}

async function getPricingSettings() {
  const supabase = await createServiceSupabaseClient();
  const { data, error } = await supabase.from("settings").select("key,value").in("key", ["default_margin", "psychological_pricing", "minimum_dp_percentage"]);
  if (error) throw error;
  const settings = new Map((data ?? []).map((row) => [row.key, row.value]));
  return {
    margin: toNumber(settings.get("default_margin"), 50_000),
    psychological: settings.get("psychological_pricing") !== false,
    minimumDpPercentage: toNumber(settings.get("minimum_dp_percentage"), 50),
  };
}

export async function calculateAuthoritativeItems(inputItems: CheckoutLineInput[]) {
  const supabase = await createServiceSupabaseClient();
  const [{ data: product, error: productError }, { data: colors, error: colorsError }, { data: sizes, error: sizesError }, { data: packages, error: packagesError }, settings] = await Promise.all([
    supabase.from("products").select("id").eq("slug", "premium-polo").eq("is_active", true).single(),
    supabase.from("product_colors").select("id,slug,product_id").eq("is_available", true),
    supabase.from("product_sizes").select("id,code,product_id").eq("is_available", true).eq("is_public", true),
    supabase.from("embroidery_packages").select("id,code,allowed_placement_sets").eq("is_active", true),
    getPricingSettings(),
  ]);
  if (productError || colorsError || sizesError || packagesError || !product) throw new Error("Katalog belum siap. Coba lagi beberapa saat lagi.");

  const productId = product.id;
  const colorMap = new Map((colors ?? []).filter((row) => row.product_id === productId).map((row) => [row.slug, row]));
  const sizeMap = new Map((sizes ?? []).filter((row) => row.product_id === productId).map((row) => [row.code, row]));
  const packageMap = new Map((packages ?? []).map((row) => [row.code, row]));
  const { data: rules, error: rulesError } = await supabase.from("embroidery_price_rules").select("embroidery_package_id,product_size_id,base_cost,selling_price_override").eq("is_active", true);
  if (rulesError) throw new Error("Harga belum dapat dimuat.");
  const ruleMap = new Map((rules ?? []).map((rule) => [`${rule.embroidery_package_id}:${rule.product_size_id}`, rule]));

  const items: StoredItem[] = inputItems.map((item) => {
    const color = colorMap.get(item.colorSlug);
    const size = sizeMap.get(item.size);
    const packageRow = packageMap.get(item.packageCode);
    if (!color || !size || !packageRow || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10_000) {
      throw new Error("Salah satu konfigurasi polo tidak lagi tersedia.");
    }
    const placements = normalizePlacementCodes(item.placementCodes);
    const allowedSets = parseAllowedSets(packageRow.allowed_placement_sets);
    if (!allowedSets.some((set) => samePlacements(set, placements))) throw new Error("Kombinasi posisi bordir belum valid.");
    const rule = ruleMap.get(`${packageRow.id}:${size.id}`);
    if (!rule) throw new Error("Harga untuk konfigurasi ini belum tersedia.");
    const baseCost = toNumber(rule.base_cost);
    const override = rule.selling_price_override == null ? null : toNumber(rule.selling_price_override);
    const unitSellingPrice = override ?? (settings.psychological ? toPsychologicalPrice(baseCost + settings.margin) : baseCost + settings.margin);
    return {
      product_id: productId,
      product_color_id: color.id,
      product_size_id: size.id,
      embroidery_package_id: packageRow.id,
      placement_codes: placements,
      quantity: item.quantity,
      unit_base_cost: baseCost,
      unit_selling_price: unitSellingPrice,
      line_total: unitSellingPrice * item.quantity,
    };
  });
  const subtotal = items.reduce((total, item) => total + item.line_total, 0);
  const totalBaseCost = items.reduce((total, item) => total + item.unit_base_cost * item.quantity, 0);
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  return { items, subtotal, totalBaseCost, totalQuantity, minimumDpPercentage: settings.minimumDpPercentage };
}

function bytesToBase64(value: Uint8Array) {
  let output = "";
  value.forEach((byte) => { output += String.fromCharCode(byte); });
  return btoa(output).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function hmac(value: string) {
  const { serviceRoleKey } = await getServiceSupabaseConfig();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(serviceRoleKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(signature));
}

export async function hashSecret(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createUploadToken(orderId: string, idempotencyKey: string) {
  const payload = bytesToBase64(new TextEncoder().encode(JSON.stringify({ orderId, idempotencyKey, expiresAt: Date.now() + CHECKOUT_UPLOAD_TOKEN_TTL_MS, nonce: crypto.randomUUID() })));
  return `nkt1.${payload}.${await hmac(payload)}`;
}

export async function verifyUploadToken(token: string, orderId: string) {
  const [version, payload, signature] = token.split(".");
  if (version !== "nkt1" || !payload || !signature || signature !== await hmac(payload)) return false;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64ToBytes(payload))) as { orderId?: string; expiresAt?: number };
    return decoded.orderId === orderId && typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
