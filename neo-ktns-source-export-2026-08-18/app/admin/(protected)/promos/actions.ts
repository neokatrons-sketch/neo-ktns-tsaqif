"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { normalisePromoCode } from "@/lib/promos";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function numberValue(formData: FormData, key: string, options: { min: number; max: number; optional?: boolean }) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw && options.optional) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= options.min && value <= options.max ? value : undefined;
}

function dateValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function resultUrl(kind: "success" | "error", code: string) {
  return `/admin/promos?${kind}=${encodeURIComponent(code)}`;
}

async function requireAdminMutation() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") redirect("/admin/login");
  return { access, supabase: await createServiceSupabaseClient() };
}

function parsePromo(formData: FormData) {
  const code = normalisePromoCode(formData.get("code"));
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 120);
  const discountType = formData.get("discountType") === "percentage" ? "percentage" : "fixed";
  const discountValue = numberValue(formData, "discountValue", { min: 1, max: discountType === "percentage" ? 100 : 100_000_000 });
  const minimumOrder = numberValue(formData, "minimumOrder", { min: 0, max: 1_000_000_000 });
  const minimumQuantity = numberValue(formData, "minimumQuantity", { min: 1, max: 100_000 });
  const maximumDiscount = discountType === "percentage" ? numberValue(formData, "maximumDiscount", { min: 0, max: 100_000_000, optional: true }) : null;
  const usageLimit = numberValue(formData, "usageLimit", { min: 1, max: 1_000_000, optional: true });
  const startsAt = dateValue(formData, "startsAt");
  const endsAt = dateValue(formData, "endsAt");
  if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !displayName || discountValue === undefined || minimumOrder === undefined || minimumQuantity === undefined || maximumDiscount === undefined || usageLimit === undefined || startsAt === undefined || endsAt === undefined) return null;
  if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) return null;
  return {
    code,
    display_name: displayName,
    discount_type: discountType,
    discount_value: discountValue,
    minimum_order: minimumOrder,
    minimum_quantity: minimumQuantity,
    maximum_discount: maximumDiscount,
    usage_limit: usageLimit,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: formData.get("isActive") === "on",
  };
}

function revalidatePromoPaths() {
  revalidatePath("/admin/promos");
  revalidatePath("/checkout");
}

export async function createPromoAction(formData: FormData) {
  const payload = parsePromo(formData);
  if (!payload) redirect(resultUrl("error", "validation"));
  const { access, supabase } = await requireAdminMutation();
  const { error } = await supabase.from("promo_codes").insert({ ...payload, usage_count: 0, updated_by: access.user.id });
  if (error) redirect(resultUrl("error", error.code === "23505" ? "duplicate" : "save"));
  revalidatePromoPaths();
  redirect(resultUrl("success", "created"));
}

export async function updatePromoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = parsePromo(formData);
  if (!UUID_PATTERN.test(id) || !payload) redirect(resultUrl("error", "validation"));
  const { access, supabase } = await requireAdminMutation();
  const { error } = await supabase.from("promo_codes").update({ ...payload, updated_by: access.user.id }).eq("id", id).is("archived_at", null);
  if (error) redirect(resultUrl("error", error.code === "23505" ? "duplicate" : "save"));
  revalidatePromoPaths();
  redirect(resultUrl("success", "updated"));
}

export async function togglePromoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(resultUrl("error", "validation"));
  const { access, supabase } = await requireAdminMutation();
  const { data: promo, error: readError } = await supabase.from("promo_codes").select("is_active,archived_at").eq("id", id).single();
  if (readError || !promo || promo.archived_at) redirect(resultUrl("error", "save"));
  const { error } = await supabase.from("promo_codes").update({ is_active: !promo.is_active, updated_by: access.user.id }).eq("id", id).is("archived_at", null);
  if (error) redirect(resultUrl("error", "save"));
  revalidatePromoPaths();
  redirect(resultUrl("success", promo.is_active ? "disabled" : "enabled"));
}

export async function archivePromoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(resultUrl("error", "validation"));
  const { access, supabase } = await requireAdminMutation();
  const { error } = await supabase.from("promo_codes").update({ is_active: false, archived_at: new Date().toISOString(), updated_by: access.user.id }).eq("id", id).is("archived_at", null);
  if (error) redirect(resultUrl("error", "save"));
  revalidatePromoPaths();
  redirect(resultUrl("success", "archived"));
}
