"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { clearBusinessSettingsCache } from "@/lib/business-settings";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function integerValue(formData: FormData, key: string, min: number, max: number) {
  const parsed = Number(formData.get(key));
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function resultUrl(kind: "success" | "error", code: string) {
  return `/admin/products?${kind}=${encodeURIComponent(code)}`;
}

async function requireAdminMutation() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") redirect("/admin/login");
  return { access, supabase: await createServiceSupabaseClient() };
}

function revalidateCatalog() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/pricing");
  revalidatePath("/custom");
  revalidatePath("/collection");
  revalidatePath("/products/premium-polo");
  revalidatePath("/size-guide");
}

export async function updateProductAction(formData: FormData) {
  const id = textValue(formData, "id", 64);
  const expectedUpdatedAt = textValue(formData, "expectedUpdatedAt", 64);
  const nameId = textValue(formData, "nameId", 120);
  const nameEn = textValue(formData, "nameEn", 120);
  const descriptionId = textValue(formData, "descriptionId", 1000);
  const material = textValue(formData, "material", 160);
  const weightMin = integerValue(formData, "weightMin", 1, 1000);
  const weightMax = integerValue(formData, "weightMax", 1, 1000);
  const productionDays = integerValue(formData, "productionDays", 1, 365);
  if (!UUID_PATTERN.test(id) || !nameId || !nameEn || !material || weightMin == null || weightMax == null || productionDays == null || weightMin > weightMax) {
    redirect(resultUrl("error", "product_validation"));
  }

  const { access, supabase } = await requireAdminMutation();
  let query = supabase.from("products").update({
    name_id: nameId,
    name_en: nameEn,
    description_id: descriptionId || null,
    material,
    weight_gsm_min: weightMin,
    weight_gsm_max: weightMax,
    production_days_min: productionDays,
    is_active: formData.get("isActive") === "on",
  }).eq("id", id);
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) redirect(resultUrl("error", "product"));
  if (!data) redirect(resultUrl("error", "conflict"));
  const { error: settingError } = await supabase.from("settings").upsert({
    key: "production_days_min",
    value: productionDays,
    description: "Minimum production time",
    is_public: false,
    updated_by: access.user.id,
  }, { onConflict: "key" });
  if (settingError) redirect(resultUrl("error", "product"));
  clearBusinessSettingsCache();
  revalidateCatalog();
  redirect(resultUrl("success", "product"));
}

export async function updateColorAvailabilityAction(formData: FormData) {
  const id = textValue(formData, "id", 64);
  const sortOrder = integerValue(formData, "sortOrder", 0, 999);
  if (!UUID_PATTERN.test(id) || sortOrder == null) redirect(resultUrl("error", "color_validation"));
  const { supabase } = await requireAdminMutation();
  const { error } = await supabase.from("product_colors").update({
    is_available: formData.get("isAvailable") === "on",
    sort_order: sortOrder,
  }).eq("id", id);
  if (error) redirect(resultUrl("error", "color"));
  revalidateCatalog();
  redirect(resultUrl("success", "color"));
}

export async function updateSizeAvailabilityAction(formData: FormData) {
  const id = textValue(formData, "id", 64);
  const sortOrder = integerValue(formData, "sortOrder", 0, 999);
  if (!UUID_PATTERN.test(id) || sortOrder == null) redirect(resultUrl("error", "size_validation"));
  const { supabase } = await requireAdminMutation();
  const { error } = await supabase.from("product_sizes").update({
    is_available: formData.get("isAvailable") === "on",
    is_public: formData.get("isPublic") === "on",
    sort_order: sortOrder,
  }).eq("id", id);
  if (error) redirect(resultUrl("error", "size"));
  revalidateCatalog();
  redirect(resultUrl("success", "size"));
}

export async function updatePackageAction(formData: FormData) {
  const id = textValue(formData, "id", 64);
  const nameId = textValue(formData, "nameId", 120);
  const nameEn = textValue(formData, "nameEn", 120);
  const descriptionId = textValue(formData, "descriptionId", 1000);
  const sortOrder = integerValue(formData, "sortOrder", 0, 999);
  if (!UUID_PATTERN.test(id) || !nameId || !nameEn || sortOrder == null) redirect(resultUrl("error", "package_validation"));
  const { supabase } = await requireAdminMutation();
  const { error } = await supabase.from("embroidery_packages").update({
    name_id: nameId,
    name_en: nameEn,
    description_id: descriptionId || null,
    is_active: formData.get("isActive") === "on",
    sort_order: sortOrder,
  }).eq("id", id);
  if (error) redirect(resultUrl("error", "package"));
  revalidateCatalog();
  redirect(resultUrl("success", "package"));
}
