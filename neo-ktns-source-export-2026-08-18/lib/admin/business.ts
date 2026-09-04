import "server-only";

import { getBusinessSettings } from "@/lib/business-settings";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export type AdminPromo = {
  id: string;
  code: string;
  displayName: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumOrder: number;
  minimumQuantity: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  archivedAt: string | null;
  updatedAt: string | null;
};

export async function getAdminPromos(): Promise<AdminPromo[]> {
  const supabase = await createServiceSupabaseClient();
  const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id),
      code: asText(item.code),
      displayName: asText(item.display_name, asText(item.code)),
      discountType: item.discount_type === "percentage" ? "percentage" : "fixed",
      discountValue: asNumber(item.discount_value),
      minimumOrder: asNumber(item.minimum_order),
      minimumQuantity: Math.max(1, asNumber(item.minimum_quantity, 1)),
      maximumDiscount: item.maximum_discount == null ? null : asNumber(item.maximum_discount),
      usageLimit: item.usage_limit == null ? null : asNumber(item.usage_limit),
      usageCount: asNumber(item.usage_count),
      startsAt: item.starts_at ? String(item.starts_at) : null,
      endsAt: item.ends_at ? String(item.ends_at) : null,
      isActive: Boolean(item.is_active),
      archivedAt: item.archived_at ? String(item.archived_at) : null,
      updatedAt: item.updated_at ? String(item.updated_at) : (item.created_at ? String(item.created_at) : null),
    };
  });
}

export type StatisticsRange = "7d" | "30d" | "month" | "all";

function rangeStart(range: StatisticsRange) {
  const now = new Date();
  if (range === "all") return null;
  if (range === "month") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

type TopSelection = { label: string; quantity: number } | null;

export type AdminStatistics = {
  range: StatisticsRange;
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  grossSales: number;
  discounts: number;
  revenue: number;
  estimatedGrossProfit: number;
  averageOrderValue: number;
  totalUnits: number;
  topColor: TopSelection;
  topSize: TopSelection;
  topPackage: TopSelection;
  waitingPayment: number;
  inProduction: number;
  qualityControl: number;
  ready: number;
  series: Array<{ label: string; orders: number; revenue: number }>;
  truncated: boolean;
};

function topFrom(map: Map<string, number>): TopSelection {
  let result: TopSelection = null;
  for (const [label, quantity] of map) if (!result || quantity > result.quantity) result = { label, quantity };
  return result;
}

export async function getAdminStatistics(range: StatisticsRange): Promise<AdminStatistics> {
  const supabase = await createServiceSupabaseClient();
  let query = supabase.from("orders").select(`
    id,status,subtotal,discount_amount,temporary_total,final_total,created_at,checked_out_at,
    selling_subtotal_before_discount,selling_subtotal_after_discount,
    order_items(
      quantity,unit_base_cost,unit_selling_price,line_total,
      product_colors(name_id),product_sizes(code),embroidery_packages(name_id)
    )
  `).neq("status", "Draft").order("created_at", { ascending: true }).limit(5000);
  const start = rangeStart(range);
  if (start) query = query.gte("created_at", start.toISOString());
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const cancelledStatuses = new Set(["Ditolak Admin", "Dibatalkan Admin"]);
  const activeRows = rows.filter((row) => !cancelledStatuses.has(String(row.status)));
  const colorCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();
  const packageCounts = new Map<string, number>();
  const seriesMap = new Map<string, { orders: number; revenue: number }>();
  let totalUnits = 0;
  let totalBaseCost = 0;

  for (const order of activeRows) {
    const created = new Date(String(order.checked_out_at ?? order.created_at));
    const bucket = range === "all"
      ? `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}`
      : created.toISOString().slice(0, 10);
    const revenue = asNumber(order.selling_subtotal_after_discount, asNumber(order.temporary_total, asNumber(order.subtotal)));
    const series = seriesMap.get(bucket) ?? { orders: 0, revenue: 0 };
    series.orders += 1;
    series.revenue += revenue;
    seriesMap.set(bucket, series);

    const items = Array.isArray(order.order_items) ? order.order_items as Array<Record<string, unknown>> : [];
    for (const item of items) {
      const quantity = asNumber(item.quantity);
      totalUnits += quantity;
      totalBaseCost += asNumber(item.unit_base_cost) * quantity;
      const color = item.product_colors as Record<string, unknown> | null;
      const size = item.product_sizes as Record<string, unknown> | null;
      const embroideryPackage = item.embroidery_packages as Record<string, unknown> | null;
      const colorLabel = asText(color?.name_id, "Tidak diketahui");
      const sizeLabel = asText(size?.code, "Tidak diketahui");
      const packageLabel = asText(embroideryPackage?.name_id, "Tidak diketahui");
      colorCounts.set(colorLabel, (colorCounts.get(colorLabel) ?? 0) + quantity);
      sizeCounts.set(sizeLabel, (sizeCounts.get(sizeLabel) ?? 0) + quantity);
      packageCounts.set(packageLabel, (packageCounts.get(packageLabel) ?? 0) + quantity);
    }
  }

  const revenue = activeRows.reduce((sum, row) => sum + asNumber(row.selling_subtotal_after_discount, asNumber(row.temporary_total, asNumber(row.subtotal))), 0);
  const grossSales = activeRows.reduce((sum, row) => sum + asNumber(row.selling_subtotal_before_discount, asNumber(row.subtotal)), 0);
  const discounts = activeRows.reduce((sum, row) => sum + asNumber(row.discount_amount), 0);
  const statusCount = (statuses: string[]) => rows.filter((row) => statuses.includes(String(row.status))).length;
  return {
    range,
    totalOrders: rows.length,
    completedOrders: statusCount(["Selesai"]),
    activeOrders: rows.filter((row) => !cancelledStatuses.has(String(row.status)) && row.status !== "Selesai").length,
    cancelledOrders: rows.filter((row) => cancelledStatuses.has(String(row.status))).length,
    grossSales,
    discounts,
    revenue,
    estimatedGrossProfit: revenue - totalBaseCost,
    averageOrderValue: activeRows.length ? Math.round(revenue / activeRows.length) : 0,
    totalUnits,
    topColor: topFrom(colorCounts),
    topSize: topFrom(sizeCounts),
    topPackage: topFrom(packageCounts),
    waitingPayment: statusCount(["Menunggu Pembayaran", "Menunggu Verifikasi Pembayaran"]),
    inProduction: statusCount(["Masuk Produksi"]),
    qualityControl: statusCount(["Quality Control"]),
    ready: statusCount(["Siap Diambil", "Siap Dikirim"]),
    series: [...seriesMap.entries()].map(([label, values]) => ({ label, ...values })),
    truncated: rows.length >= 5000,
  };
}

export async function getAdminBusinessSettings() {
  const [settings, supabase] = await Promise.all([getBusinessSettings({ fresh: true }), createServiceSupabaseClient()]);
  const { data, error } = await supabase.from("settings").select("key,updated_at,updated_by").in("key", [
    "whatsapp_number", "minimum_dp_percentage", "payment_deadline_hours", "production_days_min",
    "payment_methods", "delivery_methods", "qris_information", "preorder_notice", "return_policy_short", "pickup_notice",
  ]);
  if (error) throw error;
  const lastUpdated = (data ?? []).map((row) => row.updated_at).filter(Boolean).sort().at(-1) ?? null;
  return { settings, lastUpdated };
}
