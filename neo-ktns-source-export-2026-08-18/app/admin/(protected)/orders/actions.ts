"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { orderStatuses } from "@/lib/orders/statuses";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function orderDetailUrl(orderId: string, key: "success" | "error", value: string) {
  return `/admin/orders/${orderId}?${key}=${encodeURIComponent(value)}`;
}

async function requireAdminMutation() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") redirect("/admin/login");
  return { access, supabase: await createServiceSupabaseClient() };
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = cleanText(formData.get("orderId"), 64);
  const nextStatus = cleanText(formData.get("nextStatus"), 80);
  const note = cleanText(formData.get("statusNote"), 1000);
  if (!UUID_PATTERN.test(orderId) || !(orderStatuses as readonly string[]).includes(nextStatus)) {
    redirect("/admin/orders");
  }

  const { access, supabase } = await requireAdminMutation();
  const { error } = await supabase.rpc("admin_transition_order_status", {
    p_order_id: orderId,
    p_to_status: nextStatus,
    p_note: note || null,
    p_changed_by: access.user.id,
  });
  if (error) redirect(orderDetailUrl(orderId, "error", "status"));

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailUrl(orderId, "success", "status"));
}

export async function confirmPaymentAction(formData: FormData) {
  const orderId = cleanText(formData.get("orderId"), 64);
  const paymentState = cleanText(formData.get("paymentState"), 24);
  const paymentNote = cleanText(formData.get("paymentNote"), 1000);
  const paymentAmount = Number(formData.get("paymentAmount"));
  if (!UUID_PATTERN.test(orderId) || !["unpaid", "dp", "paid"].includes(paymentState) || !Number.isFinite(paymentAmount)) {
    redirect("/admin/orders");
  }

  const { access, supabase } = await requireAdminMutation();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("temporary_total,final_total,minimum_dp")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) redirect(orderDetailUrl(orderId, "error", "payment"));

  const total = Number(order.final_total ?? order.temporary_total);
  const minimumDp = Number(order.minimum_dp ?? Math.ceil(total / 2));
  const roundedAmount = Math.round(paymentAmount);
  let paymentStatus: "unpaid" | "dp_verified" | "paid";

  if (paymentState === "unpaid") {
    if (roundedAmount !== 0) redirect(orderDetailUrl(orderId, "error", "payment_amount"));
    paymentStatus = "unpaid";
  } else if (paymentState === "dp") {
    if (roundedAmount < minimumDp || roundedAmount >= total) {
      redirect(orderDetailUrl(orderId, "error", "payment_amount"));
    }
    paymentStatus = "dp_verified";
  } else {
    if (roundedAmount !== total) redirect(orderDetailUrl(orderId, "error", "payment_amount"));
    paymentStatus = "paid";
  }

  const confirmed = paymentStatus !== "unpaid";
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_amount: roundedAmount,
      payment_confirmed_at: confirmed ? new Date().toISOString() : null,
      payment_confirmed_by: confirmed ? access.user.id : null,
      payment_note: paymentNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) redirect(orderDetailUrl(orderId, "error", "payment"));

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailUrl(orderId, "success", "payment"));
}

export async function saveAdminNoteAction(formData: FormData) {
  const orderId = cleanText(formData.get("orderId"), 64);
  const adminNote = cleanText(formData.get("adminNote"), 4000);
  if (!UUID_PATTERN.test(orderId)) redirect("/admin/orders");

  const { supabase } = await requireAdminMutation();
  const { error } = await supabase
    .from("orders")
    .update({ admin_note: adminNote || null, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) redirect(orderDetailUrl(orderId, "error", "note"));

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(orderDetailUrl(orderId, "success", "note"));
}
