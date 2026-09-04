import "server-only";

import { getAdminAccess } from "@/lib/admin/auth";
import { orderStatuses, type OrderStatus } from "@/lib/orders/statuses";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const ORDERS_PAGE_SIZE = 20;
const REPORTING_ROW_LIMIT = 1000;

export type OrderSort = "newest" | "oldest";

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsapp: string;
  createdAt: string;
  itemQuantity: number;
  temporaryTotal: number;
  paymentMethod: string;
  deliveryMethod: string;
  status: OrderStatus;
};

export type AdminOrderList = {
  orders: AdminOrderSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminDashboardData = {
  metrics: {
    total: number;
    waitingPayment: number;
    waitingPaymentVerification: number;
    waitingDesignApproval: number;
    inProduction: number;
    qualityControl: number;
    ready: number;
    completed: number;
    estimatedRevenue: number;
    estimatedGrossProfit: number;
  };
  recentOrders: AdminOrderSummary[];
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  checkedOutAt: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentAmount: number;
  paymentConfirmedAt: string | null;
  paymentConfirmedBy: string | null;
  paymentNote: string | null;
  deliveryMethod: string;
  subtotal: number;
  shippingCost: number | null;
  discountAmount: number;
  promoCode: string | null;
  temporaryTotal: number;
  finalTotal: number | null;
  minimumDp: number;
  canvaUrl: string | null;
  customerNote: string | null;
  adminNote: string | null;
  customer: {
    fullName: string;
    whatsapp: string;
    address: string;
  };
  items: Array<{
    id: string;
    productName: string;
    colorName: string;
    colorHex: string;
    sizeCode: string;
    packageName: string;
    placements: string[];
    quantity: number;
    unitBaseCost: number;
    unitSellingPrice: number;
    unitProfit: number;
    lineTotal: number;
  }>;
  files: Array<{
    id: string;
    originalFilename: string;
    mimeType: string | null;
    sizeBytes: number;
    reviewStatus: string;
    uploadedAt: string;
  }>;
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    changedBy: string | null;
    createdAt: string;
  }>;
};

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asOrderStatus(value: unknown): OrderStatus {
  const status = String(value ?? "");
  return (orderStatuses as readonly string[]).includes(status)
    ? status as OrderStatus
    : "Draft";
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function requireAdminService() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") throw new Error("ADMIN_ACCESS_REQUIRED");
  return { access, supabase: await createServiceSupabaseClient() };
}

async function hydrateOrderSummaries(
  supabase: Awaited<ReturnType<typeof createServiceSupabaseClient>>,
  rows: Array<Record<string, unknown>>,
) {
  const customerIds = [...new Set(rows.map((row) => String(row.customer_id ?? "")).filter(Boolean))];
  const orderIds = rows.map((row) => String(row.id));
  const [{ data: customers, error: customersError }, { data: items, error: itemsError }] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id,full_name,whatsapp").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? supabase.from("order_items").select("order_id,quantity").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (customersError || itemsError) throw new Error("ADMIN_ORDERS_HYDRATION_FAILED");

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer]));
  const quantityMap = new Map<string, number>();
  for (const item of items ?? []) {
    quantityMap.set(item.order_id, (quantityMap.get(item.order_id) ?? 0) + asNumber(item.quantity));
  }

  return rows.map((row): AdminOrderSummary => {
    const customer = customerMap.get(String(row.customer_id));
    return {
      id: String(row.id),
      orderNumber: String(row.order_number),
      customerName: customer?.full_name ?? "Pelanggan",
      whatsapp: customer?.whatsapp ?? "-",
      createdAt: String(row.created_at),
      itemQuantity: quantityMap.get(String(row.id)) ?? 0,
      temporaryTotal: asNumber(row.temporary_total),
      paymentMethod: String(row.payment_method),
      deliveryMethod: String(row.delivery_method),
      status: asOrderStatus(row.status),
    };
  });
}

export async function getAdminOrders(input: {
  query?: string;
  status?: string;
  sort?: string;
  page?: number;
}): Promise<AdminOrderList> {
  const { supabase } = await requireAdminService();
  const page = Math.max(1, Math.floor(input.page || 1));
  const sort: OrderSort = input.sort === "oldest" ? "oldest" : "newest";
  const status = (orderStatuses as readonly string[]).includes(input.status ?? "") ? input.status! : "all";
  const queryText = String(input.query ?? "").trim().slice(0, 120);

  let orderQuery = supabase
    .from("orders")
    .select("id,order_number,customer_id,status,payment_method,delivery_method,temporary_total,created_at", { count: "exact" });

  if (status !== "all") orderQuery = orderQuery.eq("status", status);

  if (queryText) {
    const safeTerm = queryText.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
    const { data: matchingCustomers, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .or(`full_name.ilike.%${safeTerm}%,whatsapp.ilike.%${safeTerm}%`)
      .limit(100);
    if (customerError) throw new Error("ADMIN_ORDER_SEARCH_FAILED");
    const customerIds = (matchingCustomers ?? []).map((customer) => customer.id);
    const filters = [`order_number.ilike.%${safeTerm}%`];
    if (customerIds.length) filters.push(`customer_id.in.(${customerIds.join(",")})`);
    orderQuery = orderQuery.or(filters.join(","));
  }

  const from = (page - 1) * ORDERS_PAGE_SIZE;
  const { data, error, count } = await orderQuery
    .order("created_at", { ascending: sort === "oldest" })
    .range(from, from + ORDERS_PAGE_SIZE - 1);
  if (error) throw new Error("ADMIN_ORDERS_LIST_FAILED");

  const total = count ?? 0;
  return {
    orders: await hydrateOrderSummaries(supabase, (data ?? []) as Array<Record<string, unknown>>),
    page,
    pageSize: ORDERS_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}

async function exactOrderCount(
  supabase: Awaited<ReturnType<typeof createServiceSupabaseClient>>,
  statuses?: string[],
) {
  let query = supabase.from("orders").select("id", { count: "exact", head: true });
  query = statuses?.length
    ? query.in("status", statuses)
    : query.neq("status", "Draft");
  const { count, error } = await query;
  if (error) throw new Error("ADMIN_ORDER_METRIC_FAILED");
  return count ?? 0;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { supabase } = await requireAdminService();
  const [
    total,
    waitingPayment,
    waitingPaymentVerification,
    waitingDesignApproval,
    inProduction,
    qualityControl,
    ready,
    completed,
    activeOrdersResult,
    recentResult,
  ] = await Promise.all([
    exactOrderCount(supabase),
    exactOrderCount(supabase, ["Menunggu Pembayaran"]),
    exactOrderCount(supabase, ["Menunggu Verifikasi Pembayaran"]),
    exactOrderCount(supabase, ["Menunggu Persetujuan Desain"]),
    exactOrderCount(supabase, ["Masuk Produksi"]),
    exactOrderCount(supabase, ["Quality Control"]),
    exactOrderCount(supabase, ["Siap Diambil", "Siap Dikirim"]),
    exactOrderCount(supabase, ["Selesai"]),
    supabase
      .from("orders")
      .select("id,temporary_total,final_total")
      .not("status", "in", '("Draft","Ditolak Admin","Dibatalkan Admin")')
      .limit(REPORTING_ROW_LIMIT),
    supabase
      .from("orders")
      .select("id,order_number,customer_id,status,payment_method,delivery_method,temporary_total,created_at")
      .neq("status", "Draft")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (activeOrdersResult.error || recentResult.error) throw new Error("ADMIN_DASHBOARD_FAILED");

  const activeOrders = activeOrdersResult.data ?? [];
  const activeOrderIds = activeOrders.map((order) => order.id);
  let estimatedGrossProfit = 0;
  for (const idChunk of chunks(activeOrderIds, 100)) {
    const { data: items, error } = await supabase
      .from("order_items")
      .select("unit_profit,quantity")
      .in("order_id", idChunk);
    if (error) throw new Error("ADMIN_PROFIT_METRIC_FAILED");
    estimatedGrossProfit += (items ?? []).reduce(
      (sum, item) => sum + asNumber(item.unit_profit) * asNumber(item.quantity),
      0,
    );
  }

  return {
    metrics: {
      total,
      waitingPayment,
      waitingPaymentVerification,
      waitingDesignApproval,
      inProduction,
      qualityControl,
      ready,
      completed,
      estimatedRevenue: activeOrders.reduce(
        (sum, order) => sum + asNumber(order.final_total ?? order.temporary_total),
        0,
      ),
      estimatedGrossProfit,
    },
    recentOrders: await hydrateOrderSummaries(
      supabase,
      (recentResult.data ?? []) as Array<Record<string, unknown>>,
    ),
  };
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const { supabase } = await requireAdminService();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) throw new Error("ADMIN_ORDER_DETAIL_FAILED");
  if (!order) return null;

  const [{ data: customer, error: customerError }, { data: items, error: itemsError }, { data: files, error: filesError }, { data: logs, error: logsError }] = await Promise.all([
    supabase.from("customers").select("full_name,whatsapp,address").eq("id", order.customer_id).single(),
    supabase.from("order_items").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    supabase.from("uploaded_design_files").select("id,original_filename,mime_type,size_bytes,review_status,uploaded_at").eq("order_id", order.id).order("uploaded_at", { ascending: false }),
    supabase.from("order_status_logs").select("id,from_status,to_status,note,changed_by,created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);
  if (customerError || itemsError || filesError || logsError || !customer) {
    throw new Error("ADMIN_ORDER_RELATIONS_FAILED");
  }

  const itemRows = items ?? [];
  const productIds = [...new Set(itemRows.map((item) => item.product_id))];
  const colorIds = [...new Set(itemRows.map((item) => item.product_color_id))];
  const sizeIds = [...new Set(itemRows.map((item) => item.product_size_id))];
  const packageIds = [...new Set(itemRows.map((item) => item.embroidery_package_id))];
  const adminIds = [...new Set([
    order.payment_confirmed_by,
    ...(logs ?? []).map((log) => log.changed_by),
  ].filter(Boolean))] as string[];

  const [productsResult, colorsResult, sizesResult, packagesResult, adminsResult] = await Promise.all([
    productIds.length ? supabase.from("products").select("id,name_id").in("id", productIds) : Promise.resolve({ data: [], error: null }),
    colorIds.length ? supabase.from("product_colors").select("id,name_id,hex_color").in("id", colorIds) : Promise.resolve({ data: [], error: null }),
    sizeIds.length ? supabase.from("product_sizes").select("id,code").in("id", sizeIds) : Promise.resolve({ data: [], error: null }),
    packageIds.length ? supabase.from("embroidery_packages").select("id,name_id").in("id", packageIds) : Promise.resolve({ data: [], error: null }),
    adminIds.length ? supabase.from("admin_users").select("user_id,display_name,email").in("user_id", adminIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (productsResult.error || colorsResult.error || sizesResult.error || packagesResult.error || adminsResult.error) {
    throw new Error("ADMIN_ORDER_CATALOG_FAILED");
  }

  const productMap = new Map((productsResult.data ?? []).map((row) => [row.id, row]));
  const colorMap = new Map((colorsResult.data ?? []).map((row) => [row.id, row]));
  const sizeMap = new Map((sizesResult.data ?? []).map((row) => [row.id, row]));
  const packageMap = new Map((packagesResult.data ?? []).map((row) => [row.id, row]));
  const adminMap = new Map((adminsResult.data ?? []).map((row) => [row.user_id, row.display_name || row.email]));

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: asOrderStatus(order.status),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    checkedOutAt: order.checked_out_at,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    paymentAmount: asNumber(order.payment_amount),
    paymentConfirmedAt: order.payment_confirmed_at,
    paymentConfirmedBy: order.payment_confirmed_by ? adminMap.get(order.payment_confirmed_by) ?? "Admin" : null,
    paymentNote: order.payment_note,
    deliveryMethod: order.delivery_method,
    subtotal: asNumber(order.subtotal),
    shippingCost: order.shipping_cost == null ? null : asNumber(order.shipping_cost),
    discountAmount: asNumber(order.discount_amount),
    promoCode: order.promo_code,
    temporaryTotal: asNumber(order.temporary_total),
    finalTotal: order.final_total == null ? null : asNumber(order.final_total),
    minimumDp: asNumber(order.minimum_dp),
    canvaUrl: order.canva_url,
    customerNote: order.customer_note,
    adminNote: order.admin_note,
    customer: {
      fullName: customer.full_name,
      whatsapp: customer.whatsapp,
      address: customer.address,
    },
    items: itemRows.map((item) => ({
      id: item.id,
      productName: productMap.get(item.product_id)?.name_id ?? "Polo",
      colorName: colorMap.get(item.product_color_id)?.name_id ?? "Warna",
      colorHex: colorMap.get(item.product_color_id)?.hex_color ?? "#0F2238",
      sizeCode: sizeMap.get(item.product_size_id)?.code ?? "-",
      packageName: packageMap.get(item.embroidery_package_id)?.name_id ?? "Bordir",
      placements: Array.isArray(item.placement_codes) ? item.placement_codes : [],
      quantity: asNumber(item.quantity),
      unitBaseCost: asNumber(item.unit_base_cost),
      unitSellingPrice: asNumber(item.unit_selling_price),
      unitProfit: asNumber(item.unit_profit),
      lineTotal: asNumber(item.line_total),
    })),
    files: (files ?? []).map((file) => ({
      id: file.id,
      originalFilename: file.original_filename,
      mimeType: file.mime_type,
      sizeBytes: asNumber(file.size_bytes),
      reviewStatus: file.review_status,
      uploadedAt: file.uploaded_at,
    })),
    statusLogs: (logs ?? []).map((log) => ({
      id: log.id,
      fromStatus: log.from_status,
      toStatus: log.to_status,
      note: log.note,
      changedBy: log.changed_by ? adminMap.get(log.changed_by) ?? "Admin" : null,
      createdAt: log.created_at,
    })),
  };
}
