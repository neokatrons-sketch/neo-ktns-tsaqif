export type PublicPriceMap = Readonly<Record<string, number>>;

export function publicPriceKey(packageCode: string, sizeCode: string) {
  return `${packageCode}:${sizeCode}`;
}

export function getPublicLinePrice(
  prices: PublicPriceMap,
  packageCode: string,
  sizeCode: string,
  quantity: number,
) {
  const unit = prices[publicPriceKey(packageCode, sizeCode)];
  if (!Number.isFinite(unit) || unit < 0) return null;
  return { unit, subtotal: unit * quantity };
}
