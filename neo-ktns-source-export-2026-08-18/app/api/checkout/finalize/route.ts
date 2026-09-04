import { NextResponse } from "next/server";
import { getBusinessSettings, type BusinessSettings } from "@/lib/business-settings";
import { assertCheckoutSession, calculateAuthoritativeItems, deliveryLabel, formatRupiah, paymentLabel, readJsonRequest } from "@/lib/checkout/server";
import { normalisePromoCode } from "@/lib/promos";
import { logUnexpectedServerFailure } from "@/lib/server-log";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown } | null)?.message ?? "");
  if (message.includes("PROMO_EXPIRED")) return "Promo ini sudah berakhir.";
  if (message.includes("PROMO_REQUIREMENT")) return "Syarat promo belum terpenuhi.";
  if (message.includes("PROMO_BELOW_COST")) return "Promo ini tidak dapat digunakan untuk konfigurasi pesanan ini.";
  if (message.includes("PROMO_INVALID") || message.includes("PROMO_LIMIT")) return "Kode promo tidak valid atau tidak memenuhi syarat.";
  return message && !/Supabase|Postgrest|relation|schema|database|PGRST|constraint|duplicate key|invalid input syntax|uuid/i.test(message)
    ? message
    : "Pesanan belum dapat difinalisasi. Coba lagi beberapa saat lagi.";
}

function buildWhatsAppUrl(input: {
  settings: BusinessSettings;
  orderNumber: string;
  customer: { full_name: string; whatsapp: string; address: string };
  items: Array<{ color: string; size: string; packageName: string; placements: string[]; quantity: number; total: number }>;
  fileName: string;
  paymentMethod: string;
  deliveryMethod: string;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  promoCode: string | null;
  minimumDpPercentage: number;
  paymentDeadlineHours: number;
  productionDaysMin: number;
}) {
  const lines = input.items.map((item, index) => `${index + 1}. ${item.color} · ${item.size} · ${item.packageName}\n   Posisi: ${item.placements.join(", ")} · ${item.quantity} pcs · ${formatRupiah(item.total)}`).join("\n");
  const promoLine = input.discountAmount > 0
    ? `\nPromo ${input.promoCode ?? ""}: -${formatRupiah(input.discountAmount)}\nSubtotal setelah promo: ${formatRupiah(input.subtotalAfterDiscount)}`
    : "";
  const qrisLine = input.paymentMethod === "QRIS" && input.settings.qrisInformation
    ? `\nInfo QRIS: ${input.settings.qrisInformation}`
    : "";
  const message = `Halo Neo KTNS, saya ingin mengonfirmasi pesanan berikut.\n\nID Pesanan: ${input.orderNumber}\nNama: ${input.customer.full_name}\nWhatsApp: ${input.customer.whatsapp}\nAlamat: ${input.customer.address}\n\nDETAIL PESANAN\n${lines}\n\nFile desain: ${input.fileName}\nMetode pembayaran: ${paymentLabel(input.paymentMethod)}${qrisLine}\nMetode penerimaan: ${deliveryLabel(input.deliveryMethod)}\n\nSubtotal: ${formatRupiah(input.subtotalBeforeDiscount)}${promoLine}\nOngkir: dikonfirmasi admin\nTotal akhir: dikonfirmasi admin\n\nDP minimal: ${input.minimumDpPercentage}%\nBatas pembayaran: ${input.paymentDeadlineHours} jam\n\nSaya memahami bahwa:\n- ${input.settings.preorderNotice}\n- Estimasi produksi minimal ${input.productionDaysMin} hari setelah desain dan pembayaran dikonfirmasi\n- ${input.settings.returnPolicyShort}\n\nMohon konfirmasi desain, ongkir, total akhir, dan instruksi pembayaran saya.`;
  return `https://wa.me/${input.settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: Request) {
  try {
    const { orderId, idempotencyKey, promoCode: promoInput } = await readJsonRequest(request) as { orderId?: string; idempotencyKey?: string; promoCode?: unknown };
    if (!orderId || !idempotencyKey) throw new Error("Sesi checkout tidak valid. Silakan coba lagi.");
    assertCheckoutSession(orderId, idempotencyKey);
    const promoCode = normalisePromoCode(promoInput) || null;
    const settings = await getBusinessSettings();
    const supabase = await createServiceSupabaseClient();
    const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).eq("idempotency_key", idempotencyKey).single();
    if (orderError || !orderData) throw new Error("Draft pesanan tidak ditemukan.");
    const order = orderData as Record<string, unknown>;
    const [{ data: customer, error: customerError }, { data: items, error: itemsError }, { data: files, error: filesError }] = await Promise.all([
      supabase.from("customers").select("full_name,whatsapp,address").eq("id", order.customer_id).single(),
      supabase.from("order_items").select("id,product_color_id,product_size_id,embroidery_package_id,placement_codes,quantity,unit_base_cost,unit_selling_price,line_total").eq("order_id", order.id),
      supabase.from("uploaded_design_files").select("original_filename").eq("order_id", order.id).order("uploaded_at", { ascending: false }).limit(1),
    ]);
    if (customerError || itemsError || filesError || !customer || !items?.length) throw new Error("Data pesanan belum lengkap.");
    if (!files?.[0]) throw new Error("Unggah file desain sebelum mengirim pesanan.");

    const [{ data: colors }, { data: sizes }, { data: packages }] = await Promise.all([
      supabase.from("product_colors").select("id,slug,name_id"),
      supabase.from("product_sizes").select("id,code"),
      supabase.from("embroidery_packages").select("id,code,name_id"),
    ]);
    const colorMap = new Map((colors ?? []).map((row) => [row.id, row]));
    const sizeMap = new Map((sizes ?? []).map((row) => [row.id, row]));
    const packageMap = new Map((packages ?? []).map((row) => [row.id, row]));
    let finalOrder = order;
    let displayTotals = items.map((item) => asNumber(item.line_total));
    let recalculatedSubtotal = displayTotals.reduce((total, value) => total + value, 0);
    if (order.status === "Draft") {
      const inputItems = items.map((item) => {
        const color = colorMap.get(item.product_color_id);
        const size = sizeMap.get(item.product_size_id);
        const embroideryPackage = packageMap.get(item.embroidery_package_id);
        if (!color || !size || !embroideryPackage) throw new Error("Konfigurasi pesanan tidak lagi tersedia.");
        return { colorSlug: color.slug, size: size.code, packageCode: embroideryPackage.code, placementCodes: item.placement_codes, quantity: item.quantity };
      });
      const recalculated = await calculateAuthoritativeItems(inputItems);
      if (recalculated.items.length !== items.length) throw new Error("Harga pesanan tidak dapat divalidasi.");
      for (let index = 0; index < items.length; index += 1) {
        const next = recalculated.items[index];
        const { error } = await supabase.from("order_items").update({ unit_base_cost: next.unit_base_cost, unit_selling_price: next.unit_selling_price, line_total: next.line_total }).eq("id", items[index].id).eq("order_id", order.id);
        if (error) throw error;
      }
      displayTotals = recalculated.items.map((item) => item.line_total);
      recalculatedSubtotal = recalculated.subtotal;

      const { data: finalized, error: finalizeError } = await supabase.rpc("finalize_checkout_order", {
        p_order_id: order.id,
        p_idempotency_key: idempotencyKey,
        p_promo_code: promoCode,
        p_minimum_dp_percentage: Math.round(settings.minimumDpPercentage),
        p_payment_deadline_hours: Math.round(settings.paymentDeadlineHours),
        p_production_days_min: Math.round(settings.productionDaysMin),
      });
      if (finalizeError || !finalized) throw finalizeError ?? new Error("Pesanan belum dapat difinalisasi.");
      finalOrder = finalized as Record<string, unknown>;
    }

    const displayItems = items.map((item, index) => ({
      color: colorMap.get(item.product_color_id)?.name_id ?? "Warna",
      size: sizeMap.get(item.product_size_id)?.code ?? "-",
      packageName: packageMap.get(item.embroidery_package_id)?.name_id ?? "Bordir",
      placements: item.placement_codes,
      quantity: item.quantity,
      total: displayTotals[index],
    }));
    const subtotalBeforeDiscount = asNumber(finalOrder.selling_subtotal_before_discount, asNumber(finalOrder.subtotal, recalculatedSubtotal));
    const discountAmount = asNumber(finalOrder.discount_amount);
    const subtotalAfterDiscount = asNumber(finalOrder.selling_subtotal_after_discount, asNumber(finalOrder.temporary_total, subtotalBeforeDiscount - discountAmount));
    return NextResponse.json({
      orderNumber: String(finalOrder.order_number),
      whatsappUrl: buildWhatsAppUrl({
        settings,
        orderNumber: String(finalOrder.order_number),
        customer,
        items: displayItems,
        fileName: files[0].original_filename,
        paymentMethod: String(finalOrder.payment_method),
        deliveryMethod: String(finalOrder.delivery_method),
        subtotalBeforeDiscount,
        discountAmount,
        subtotalAfterDiscount,
        promoCode: finalOrder.promo_code ? String(finalOrder.promo_code) : null,
        minimumDpPercentage: asNumber(finalOrder.minimum_dp_percentage_snapshot, settings.minimumDpPercentage),
        paymentDeadlineHours: asNumber(finalOrder.payment_deadline_hours_snapshot, settings.paymentDeadlineHours),
        productionDaysMin: asNumber(finalOrder.production_days_min_snapshot, settings.productionDaysMin),
      }),
    });
  } catch (error) {
    logUnexpectedServerFailure("checkout/finalize", error);
    return NextResponse.json({ error: safeError(error) }, { status: 400 });
  }
}
