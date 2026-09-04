import "server-only";

import { getAdminAccess } from "@/lib/admin/auth";
import { embroideryPackages as structuralPackages } from "@/lib/catalog";
import { toPsychologicalPrice } from "@/lib/pricing";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requireAdminService() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") throw new Error("ADMIN_ACCESS_REQUIRED");
  return { access, supabase: await createServiceSupabaseClient() };
}

export async function getAdminCatalogData() {
  const { supabase } = await requireAdminService();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug,name_id,name_en,description_id,description_en,material,weight_gsm_min,weight_gsm_max,production_days_min,is_active,created_at,updated_at")
    .eq("slug", "premium-polo")
    .maybeSingle();
  if (productError || !product) throw new Error("ADMIN_PRODUCT_LOAD_FAILED");

  const [colorsResult, sizesResult, packagesResult] = await Promise.all([
    supabase.from("product_colors").select("id,slug,name_id,name_en,hex_color,sort_order,is_available").eq("product_id", product.id).order("sort_order"),
    supabase.from("product_sizes").select("id,code,length_cm,chest_circumference_cm,is_public,is_available,sort_order").eq("product_id", product.id).order("sort_order"),
    supabase.from("embroidery_packages").select("id,code,name_id,name_en,description_id,small_point_count,includes_back,allowed_placement_sets,is_active,sort_order").order("sort_order"),
  ]);
  if (colorsResult.error || sizesResult.error || packagesResult.error) throw new Error("ADMIN_CATALOG_LOAD_FAILED");

  const structuralMap = new Map(structuralPackages.map((item) => [item.code, item]));
  return {
    product,
    colors: colorsResult.data ?? [],
    sizes: sizesResult.data ?? [],
    packages: (packagesResult.data ?? []).map((item) => {
      const structural = structuralMap.get(item.code);
      return {
        ...item,
        placementRule: structural?.placementRule ?? "Aturan placement tetap dikelola sistem.",
        maxSize: structural?.maxSize ?? "Mengikuti batas produksi Neo KTNS.",
      };
    }),
  };
}

export async function getAdminPricingData() {
  const { supabase } = await requireAdminService();
  const [sizesResult, packagesResult, rulesResult, settingsResult] = await Promise.all([
    supabase.from("product_sizes").select("id,code,sort_order,is_available,is_public").order("sort_order"),
    supabase.from("embroidery_packages").select("id,code,name_id,sort_order,is_active").order("sort_order"),
    supabase.from("embroidery_price_rules").select("id,embroidery_package_id,product_size_id,base_cost,selling_price_override,is_active,updated_at"),
    supabase.from("settings").select("key,value,updated_at,updated_by").in("key", ["default_margin", "psychological_pricing"]),
  ]);
  if (sizesResult.error || packagesResult.error || rulesResult.error || settingsResult.error) {
    throw new Error("ADMIN_PRICING_LOAD_FAILED");
  }

  const settingMap = new Map((settingsResult.data ?? []).map((row) => [row.key, row]));
  const marginSetting = settingMap.get("default_margin");
  const psychologicalSetting = settingMap.get("psychological_pricing");
  const margin = asNumber(marginSetting?.value, 50_000);
  const psychological = psychologicalSetting?.value !== false && psychologicalSetting?.value !== "false";

  return {
    sizes: sizesResult.data ?? [],
    packages: packagesResult.data ?? [],
    margin: {
      value: margin,
      updatedAt: marginSetting?.updated_at ?? null,
      updatedBy: marginSetting?.updated_by ?? null,
    },
    psychological,
    rules: (rulesResult.data ?? []).map((rule) => {
      const baseCost = asNumber(rule.base_cost);
      const override = rule.selling_price_override == null ? null : asNumber(rule.selling_price_override);
      const rawSellingPrice = baseCost + margin;
      const calculatedPrice = psychological ? toPsychologicalPrice(rawSellingPrice) : rawSellingPrice;
      const finalPrice = override ?? calculatedPrice;
      return {
        ...rule,
        baseCost,
        override,
        rawSellingPrice,
        calculatedPrice,
        finalPrice,
        profit: finalPrice - baseCost,
      };
    }),
  };
}
