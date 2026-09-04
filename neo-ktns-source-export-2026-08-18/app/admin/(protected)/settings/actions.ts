"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { clearBusinessSettingsCache } from "@/lib/business-settings";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function integer(formData: FormData, key: string, min: number, max: number) {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function normalizeWhatsapp(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return /^62[0-9]{8,14}$/.test(digits) ? digits : null;
}

function option(formData: FormData, prefix: string, value: string, defaultLabel: string, defaultHelper = "") {
  return {
    value,
    label: text(formData, `${prefix}Label`, 80) || defaultLabel,
    enabled: formData.get(`${prefix}Enabled`) === "on",
    helper: text(formData, `${prefix}Helper`, 240) || defaultHelper,
  };
}

export async function updateBusinessSettingsAction(formData: FormData) {
  const access = await getAdminAccess();
  if (access.kind !== "admin") redirect("/admin/login");

  const whatsapp = normalizeWhatsapp(text(formData, "whatsappNumber", 32));
  const minimumDp = integer(formData, "minimumDpPercentage", 0, 100);
  const paymentDeadline = integer(formData, "paymentDeadlineHours", 1, 720);
  const productionDays = integer(formData, "productionDaysMin", 1, 365);
  const preorderNotice = text(formData, "preorderNotice", 1_000);
  const returnPolicy = text(formData, "returnPolicyShort", 1_000);
  const pickupNotice = text(formData, "pickupNotice", 1_000);
  if (!whatsapp || minimumDp == null || paymentDeadline == null || productionDays == null || !preorderNotice || !returnPolicy || !pickupNotice) {
    redirect("/admin/settings?error=validation");
  }

  const paymentMethods = [
    option(formData, "paymentQris", "QRIS", "QRIS"),
    option(formData, "paymentCash", "Cash", "Cash"),
    option(formData, "paymentAdmin", "Konfirmasi dengan admin", "Konfirmasi dengan admin"),
  ];
  const deliveryMethods = [
    option(formData, "deliveryPickup", "Ambil di sekolah", "Ambil di sekolah", "Lokasi dan waktu dikonfirmasi admin."),
    option(formData, "deliveryCod", "COD / kurir", "COD / kurir", "Biaya dan titik temu dikonfirmasi admin."),
    option(formData, "deliveryShipping", "Pengiriman, ongkir dikonfirmasi admin", "Pengiriman", "Ongkir dikonfirmasi admin."),
  ];
  if (!paymentMethods.some((item) => item.enabled) || !deliveryMethods.some((item) => item.enabled)) {
    redirect("/admin/settings?error=options");
  }

  const supabase = await createServiceSupabaseClient();
  const rows = [
    ["whatsapp_number", whatsapp, "Admin WhatsApp number"],
    ["minimum_dp_percentage", minimumDp, "Minimum down payment percentage"],
    ["payment_deadline_hours", paymentDeadline, "Payment deadline after checkout"],
    ["production_days_min", productionDays, "Minimum production time"],
    ["payment_methods", paymentMethods, "Customer-safe payment options"],
    ["delivery_methods", deliveryMethods, "Customer-safe delivery options"],
    ["qris_information", text(formData, "qrisInformation", 500), "Optional public QRIS information; never credentials"],
    ["preorder_notice", preorderNotice, "Short preorder notice"],
    ["return_policy_short", returnPolicy, "Short custom-product return policy"],
    ["pickup_notice", pickupNotice, "School pickup notice"],
  ].map(([key, value, description]) => ({ key, value, description, is_public: false, updated_by: access.user.id }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) redirect("/admin/settings?error=save");
  const { error: productError } = await supabase.from("products").update({ production_days_min: productionDays }).eq("slug", "premium-polo");
  if (productError) redirect("/admin/settings?error=save");

  clearBusinessSettingsCache();
  for (const path of ["/admin/settings", "/checkout", "/track-order", "/faq", "/", "/products/premium-polo", "/custom"]) revalidatePath(path);
  redirect("/admin/settings?success=saved");
}
