"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PRICE = 100_000_000;

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function moneyValue(value: FormDataEntryValue | null): number | undefined;
function moneyValue(value: FormDataEntryValue | null, allowBlank: true): number | null | undefined;
function moneyValue(value: FormDataEntryValue | null, allowBlank = false) {
  const raw = String(value ?? "").trim();
  if (allowBlank && !raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_PRICE ? parsed : undefined;
}

function resultUrl(kind: "success" | "error", code: string) {
  return `/admin/pricing?${kind}=${encodeURIComponent(code)}`;
}

async function requireAdminMutation() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") redirect("/admin/login");
  return { access, supabase: await createServiceSupabaseClient() };
}

function revalidatePricing() {
  revalidatePath("/admin/pricing");
  revalidatePath("/custom");
  revalidatePath("/collection");
  revalidatePath("/products/premium-polo");
}

export async function updatePricingRuleAction(formData: FormData) {
  const id = textValue(formData, "id", 64);
  const expectedUpdatedAt = textValue(formData, "expectedUpdatedAt", 64);
  const baseCost = moneyValue(formData.get("baseCost"));
  const override = moneyValue(formData.get("override"), true);
  if (!UUID_PATTERN.test(id) || baseCost === undefined || override === undefined) {
    redirect(resultUrl("error", "invalid_amount"));
  }
  if (override !== null && override < baseCost) redirect(resultUrl("error", "below_cost"));

  const { supabase } = await requireAdminMutation();
  let query = supabase.from("embroidery_price_rules").update({
    base_cost: baseCost,
    selling_price_override: override,
  }).eq("id", id);
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) redirect(resultUrl("error", "pricing"));
  if (!data) redirect(resultUrl("error", "conflict"));
  revalidatePricing();
  redirect(resultUrl("success", override === null ? "pricing" : "override"));
}

export async function updateDefaultMarginAction(formData: FormData) {
  const margin = moneyValue(formData.get("margin"));
  const expectedUpdatedAt = textValue(formData, "expectedUpdatedAt", 64);
  if (margin === undefined) redirect(resultUrl("error", "invalid_margin"));

  const { access, supabase } = await requireAdminMutation();
  let query = supabase.from("settings").update({
    value: margin,
    updated_by: access.user.id,
  }).eq("key", "default_margin");
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select("key").maybeSingle();
  if (error) redirect(resultUrl("error", "margin"));
  if (!data) redirect(resultUrl("error", "conflict"));
  revalidatePricing();
  redirect(resultUrl("success", "margin"));
}
