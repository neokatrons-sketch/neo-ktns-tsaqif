import { NextResponse } from "next/server";
import { calculateAuthoritativeItems, readJsonRequest, validateCheckoutLines } from "@/lib/checkout/server";
import { validatePromoForOrder } from "@/lib/promos";
import { logUnexpectedServerFailure } from "@/lib/server-log";

function safeError(error: unknown) {
  return error instanceof Error && !/Supabase|Postgrest|relation|schema|database|constraint|duplicate key|invalid input syntax|PGRST/i.test(error.message)
    ? error.message
    : "Promo belum dapat diperiksa. Silakan coba lagi.";
}

export async function POST(request: Request) {
  try {
    const body = await readJsonRequest(request) as { promoCode?: unknown; items?: unknown };
    const items = validateCheckoutLines(body.items);
    const pricing = await calculateAuthoritativeItems(items);
    const result = await validatePromoForOrder(body.promoCode, {
      subtotal: pricing.subtotal,
      totalBaseCost: pricing.totalBaseCost,
      totalQuantity: pricing.totalQuantity,
    });
    return NextResponse.json(result, { status: result.valid ? 200 : 400 });
  } catch (error) {
    logUnexpectedServerFailure("checkout/promo", error);
    return NextResponse.json({ error: safeError(error) }, { status: 400 });
  }
}
