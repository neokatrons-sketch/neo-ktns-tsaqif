import {
  colors,
  getEmbroideryPackage,
  sizes,
  type ColorSlug,
  type PackageCode,
  type SizeCode,
} from "@/lib/catalog";
import { getPublicLinePrice, type PublicPriceMap } from "@/lib/public-pricing";

export type OrderBuilderItem = {
  id: string;
  colorSlug: ColorSlug;
  size: SizeCode;
  packageCode: PackageCode;
  presetId: string;
  quantity: number;
};

export type OrderBuilderDraft = Omit<OrderBuilderItem, "id">;

export const ORDER_BUILDER_STORAGE_KEY = "neo-ktns-order-builder-v1";

export function getOrderLinePrice(item: OrderBuilderDraft, prices: PublicPriceMap) {
  return getPublicLinePrice(prices, item.packageCode, item.size, item.quantity);
}

export function isOrderItemComplete(item: Partial<OrderBuilderItem>): item is OrderBuilderItem {
  if (
    typeof item.id !== "string" ||
    !colors.some((color) => color.slug === item.colorSlug) ||
    !sizes.some((size) => size.code === item.size) ||
    !Number.isInteger(item.quantity) ||
    (item.quantity ?? 0) < 1
  ) {
    return false;
  }

  const embroideryPackage = item.packageCode
    ? getEmbroideryPackage(item.packageCode)
    : undefined;

  return Boolean(
    embroideryPackage &&
      typeof item.presetId === "string" &&
      embroideryPackage.presets.some((preset) => preset.id === item.presetId),
  );
}

export function parseStoredOrderItems(value: string | null) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isOrderItemComplete) : [];
  } catch {
    return [];
  }
}
