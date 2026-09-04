import "server-only";

import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type PromoPriceContext = {
  subtotal: number;
  totalBaseCost: number;
  totalQuantity: number;
};

export type PromoResult = {
  valid: boolean;
  code: string;
  discountAmount: number;
  subtotalAfterDiscount: number;
  message: string;
  reason?: "invalid" | "expired" | "requirement" | "limit" | "below_cost";
};

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalisePromoCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);
}

function invalid(context: PromoPriceContext, code: string, reason: PromoResult["reason"], message: string): PromoResult {
  return { valid: false, code, discountAmount: 0, subtotalAfterDiscount: context.subtotal, reason, message };
}

export async function validatePromoForOrder(codeInput: unknown, context: PromoPriceContext): Promise<PromoResult> {
  const code = normalisePromoCode(codeInput);
  if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return invalid(context, code, "invalid", "Kode promo tidak valid atau tidak memenuhi syarat.");
  }

  const supabase = await createServiceSupabaseClient();
  const query = await supabase.from("promo_codes").select("*").eq("code", code).maybeSingle();
  if (query.error || !query.data) return invalid(context, code, "invalid", "Kode promo tidak valid atau tidak memenuhi syarat.");
  const promo = query.data as Record<string, unknown>;
  if (!promo.is_active || promo.archived_at) return invalid(context, code, "invalid", "Kode promo tidak valid atau tidak memenuhi syarat.");

  const now = Date.now();
  const startsAt = promo.starts_at ? Date.parse(String(promo.starts_at)) : null;
  const endsAt = promo.ends_at ? Date.parse(String(promo.ends_at)) : null;
  if ((startsAt != null && now < startsAt) || (endsAt != null && now >= endsAt)) {
    return invalid(context, code, "expired", endsAt != null && now >= endsAt ? "Promo ini sudah berakhir." : "Promo ini belum dapat digunakan.");
  }

  const minimumOrder = asNumber(promo.minimum_order);
  const minimumQuantity = Math.max(1, asNumber(promo.minimum_quantity, 1));
  if (context.subtotal < minimumOrder || context.totalQuantity < minimumQuantity) {
    return invalid(context, code, "requirement", "Syarat promo belum terpenuhi.");
  }

  const usageLimit = promo.usage_limit == null ? null : asNumber(promo.usage_limit);
  const usageCount = asNumber(promo.usage_count);
  if (usageLimit != null && usageCount >= usageLimit) {
    return invalid(context, code, "limit", "Kode promo tidak valid atau tidak memenuhi syarat.");
  }

  const type = String(promo.discount_type);
  const value = asNumber(promo.discount_value);
  let discountAmount = 0;
  if (type === "percentage" && value > 0 && value <= 100) {
    discountAmount = Math.floor(context.subtotal * value / 100);
    if (promo.maximum_discount != null) discountAmount = Math.min(discountAmount, Math.max(0, asNumber(promo.maximum_discount)));
  } else if (type === "fixed" && value > 0) {
    discountAmount = Math.min(value, context.subtotal);
  } else {
    return invalid(context, code, "invalid", "Kode promo tidak valid atau tidak memenuhi syarat.");
  }

  if (discountAmount <= 0) return invalid(context, code, "invalid", "Kode promo tidak valid atau tidak memenuhi syarat.");
  const subtotalAfterDiscount = context.subtotal - discountAmount;
  if (subtotalAfterDiscount < context.totalBaseCost) {
    return invalid(context, code, "below_cost", "Promo ini tidak dapat digunakan untuk konfigurasi pesanan ini.");
  }

  return { valid: true, code, discountAmount, subtotalAfterDiscount, message: "Promo berhasil digunakan." };
}
