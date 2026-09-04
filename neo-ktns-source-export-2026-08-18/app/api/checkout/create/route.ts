import { NextResponse } from "next/server";
import { assertCheckoutOptionsEnabled, calculateAuthoritativeItems, checkoutCustomerId, checkoutOrderItemId, createUploadToken, hashSecret, readJsonRequest, validateCheckoutInput } from "@/lib/checkout/server";
import { logUnexpectedServerFailure } from "@/lib/server-log";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function safeError(error: unknown) {
  return error instanceof Error && !/Supabase|Postgrest|relation|schema|storage|constraint|duplicate key|invalid input syntax|PGRST/i.test(error.message)
    ? error.message
    : "Pesanan belum dapat disimpan. Coba lagi beberapa saat lagi.";
}

export async function POST(request: Request) {
  try {
    const input = validateCheckoutInput(await readJsonRequest(request));
    const businessSettings = await assertCheckoutOptionsEnabled(input);
    const supabase = await createServiceSupabaseClient();
    const { data: existing, error: existingError } = await supabase
      .from("orders")
      .select("id,order_number,status,subtotal")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existingError) throw existingError;

    let authoritativePricing: Awaited<ReturnType<typeof calculateAuthoritativeItems>> | null = null;
    async function getPricing() {
      authoritativePricing ??= await calculateAuthoritativeItems(input.items);
      return authoritativePricing;
    }
    async function ensureOrderItems(orderId: string) {
      const { count, error: countError } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("order_id", orderId);
      if (countError) throw countError;
      if ((count ?? 0) > 0) return;
      const pricing = await getPricing();
      const itemIds = await Promise.all(pricing.items.map((_, index) => checkoutOrderItemId(input.idempotencyKey, index)));
      const { error: itemError } = await supabase.from("order_items").insert(pricing.items.map((item, index) => ({ ...item, id: itemIds[index], order_id: orderId })));
      if (!itemError) return;
      const { count: recoveredCount, error: recoveredError } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("order_id", orderId);
      if (recoveredError || recoveredCount !== pricing.items.length) throw itemError;
    }

    let order = existing;
    if (!order) {
      const pricing = await getPricing();
      const customerId = await checkoutCustomerId(input.idempotencyKey);
      const { error: customerError } = await supabase.from("customers").upsert({
        id: customerId,
        full_name: input.fullName,
        whatsapp: input.whatsappNumber,
        address: input.address,
      }, { onConflict: "id", ignoreDuplicates: true });
      if (customerError) throw customerError;

      const { data: orderNumber, error: numberError } = await supabase.rpc("next_order_number");
      if (numberError || typeof orderNumber !== "string") throw numberError ?? new Error("Nomor pesanan belum tersedia.");
      const minimumDp = Math.ceil((pricing.subtotal * businessSettings.minimumDpPercentage) / 100);
      const { data: created, error: createError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "Draft",
        payment_method: input.paymentMethod,
        delivery_method: input.deliveryMethod,
        subtotal: pricing.subtotal,
        temporary_total: pricing.subtotal,
        minimum_dp: minimumDp,
        canva_url: input.canvaUrl ?? null,
        customer_note: input.customerNote ?? null,
        idempotency_key: input.idempotencyKey,
      }).select("id,order_number,status,subtotal").single();

      if (createError || !created) {
        const { data: retried } = await supabase.from("orders").select("id,order_number,status,subtotal").eq("idempotency_key", input.idempotencyKey).maybeSingle();
        if (!retried) throw createError ?? new Error("Pesanan belum dapat dibuat.");
        order = retried;
      } else {
        order = created;
      }
    }

    if (!order) throw new Error("Pesanan belum dapat dibuat.");
    if (order.status !== "Draft") {
      return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, subtotal: order.subtotal, finalized: true });
    }
    await ensureOrderItems(order.id);

    const uploadToken = await createUploadToken(order.id, input.idempotencyKey);
    const { error: tokenError } = await supabase.from("orders").update({ upload_token_hash: await hashSecret(uploadToken) }).eq("id", order.id).eq("status", "Draft");
    if (tokenError) throw tokenError;
    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, subtotal: order.subtotal, uploadToken, finalized: false });
  } catch (error) {
    logUnexpectedServerFailure("checkout/create", error);
    return NextResponse.json({ error: safeError(error) }, { status: 400 });
  }
}
