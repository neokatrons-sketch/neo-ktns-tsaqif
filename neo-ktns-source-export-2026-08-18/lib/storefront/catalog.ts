import "server-only";

import {
  colors as structuralColors,
  embroideryPackages as structuralPackages,
  sizes as structuralSizes,
  type ColorSlug,
  type PackageCode,
  type SizeCode,
} from "@/lib/catalog";
import { toPsychologicalPrice } from "@/lib/pricing";
import { publicPriceKey } from "@/lib/public-pricing";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type PublicConfiguratorCatalog = {
  product: {
    slug: string;
    name: string;
    nameEn: string;
    description: string;
    material: string;
    weight: string;
    productionDays: number;
  };
  colors: Array<{
    slug: ColorSlug;
    name: string;
    nameEn: string;
    hex: string;
  }>;
  sizes: Array<{
    code: SizeCode;
    public: boolean;
    length: number | null;
    chest: number | null;
  }>;
  packages: Array<{
    code: PackageCode;
    name: string;
    nameEn: string;
    summary: string;
  }>;
  prices: Record<string, number>;
};

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Builds the customer-safe configurator payload on the server. Base costs,
 * margin, override metadata, and profit never enter the returned object.
 */
export async function getPublicConfiguratorCatalog(): Promise<PublicConfiguratorCatalog> {
  const supabase = await createServiceSupabaseClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug,name_id,name_en,description_id,material,weight_gsm_min,weight_gsm_max,production_days_min")
    .eq("slug", "premium-polo")
    .eq("is_active", true)
    .maybeSingle();
  if (productError || !product) throw new Error("PUBLIC_CATALOG_UNAVAILABLE");

  const [colorsResult, sizesResult, packagesResult, rulesResult, settingsResult] = await Promise.all([
    supabase
      .from("product_colors")
      .select("id,slug,name_id,name_en,hex_color,sort_order")
      .eq("product_id", product.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_sizes")
      .select("id,code,length_cm,chest_circumference_cm,is_public,sort_order")
      .eq("product_id", product.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("embroidery_packages")
      .select("id,code,name_id,name_en,description_id,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("embroidery_price_rules")
      .select("embroidery_package_id,product_size_id,base_cost,selling_price_override")
      .eq("is_active", true),
    supabase
      .from("settings")
      .select("key,value")
      .in("key", ["default_margin", "psychological_pricing"]),
  ]);
  if (colorsResult.error || sizesResult.error || packagesResult.error || rulesResult.error || settingsResult.error) {
    throw new Error("PUBLIC_CATALOG_UNAVAILABLE");
  }

  const knownColorCodes = new Set(structuralColors.map((color) => color.slug));
  const knownSizeCodes = new Set(structuralSizes.map((size) => size.code));
  const knownPackageCodes = new Set(structuralPackages.map((item) => item.code));
  const safeColors = (colorsResult.data ?? []).filter((row) => knownColorCodes.has(row.slug as ColorSlug));
  const safeSizes = (sizesResult.data ?? []).filter((row) => knownSizeCodes.has(row.code as SizeCode));
  const safePackages = (packagesResult.data ?? []).filter((row) => knownPackageCodes.has(row.code as PackageCode));
  const settings = new Map((settingsResult.data ?? []).map((row) => [row.key, row.value]));
  const margin = asNumber(settings.get("default_margin"), 50_000);
  const psychologicalValue = settings.get("psychological_pricing");
  const psychological = psychologicalValue !== false && psychologicalValue !== "false";
  const sizeCodeById = new Map(safeSizes.map((size) => [size.id, size.code]));
  const packageCodeById = new Map(safePackages.map((item) => [item.id, item.code]));
  const prices: Record<string, number> = {};

  for (const rule of rulesResult.data ?? []) {
    const sizeCode = sizeCodeById.get(rule.product_size_id);
    const packageCode = packageCodeById.get(rule.embroidery_package_id);
    if (!sizeCode || !packageCode) continue;
    const baseCost = asNumber(rule.base_cost);
    const override = rule.selling_price_override == null ? null : asNumber(rule.selling_price_override);
    prices[publicPriceKey(packageCode, sizeCode)] = override ?? (
      psychological ? toPsychologicalPrice(baseCost + margin) : baseCost + margin
    );
  }

  const weightMin = asNumber(product.weight_gsm_min);
  const weightMax = asNumber(product.weight_gsm_max);
  return {
    product: {
      slug: product.slug,
      name: product.name_id,
      nameEn: product.name_en,
      description: product.description_id ?? "Polo custom premium untuk siswa, komunitas, dan organisasi.",
      material: product.material,
      weight: weightMin && weightMax ? `${weightMin}–${weightMax} gsm` : "Gramasi belum dikonfigurasi",
      productionDays: asNumber(product.production_days_min, 15),
    },
    colors: safeColors.map((row) => ({
      slug: row.slug as ColorSlug,
      name: row.name_id,
      nameEn: row.name_en,
      hex: row.hex_color,
    })),
    sizes: safeSizes.map((row) => ({
      code: row.code as SizeCode,
      public: row.is_public,
      length: row.length_cm == null ? null : asNumber(row.length_cm),
      chest: row.chest_circumference_cm == null ? null : asNumber(row.chest_circumference_cm),
    })),
    packages: safePackages.map((row) => ({
      code: row.code as PackageCode,
      name: row.name_id,
      nameEn: row.name_en,
      summary: row.description_id ?? "Paket bordir Neo KTNS.",
    })),
    prices,
  };
}
