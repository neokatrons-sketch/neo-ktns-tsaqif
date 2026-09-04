"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  confirmPaymentAction,
  updateOrderStatusAction,
} from "@/app/admin/(protected)/orders/actions";
import { formatAdminCurrency } from "@/lib/admin/format";
import { orderStatuses, type OrderStatus } from "@/lib/orders/statuses";

function SubmitButton({ children }: React.PropsWithChildren) {
  const { pending } = useFormStatus();
  return <button
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-[#17324f] disabled:cursor-wait disabled:opacity-60"
    disabled={pending}
    type="submit"
  >
    {pending && <LoaderCircle className="animate-spin" size={16} />}{children}
  </button>;
}

export function StatusUpdateForm({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [nextStatus, setNextStatus] = useState<OrderStatus>(currentStatus);
  const terminalStatuses = new Set<OrderStatus>(["Selesai", "Ditolak Admin", "Dibatalkan Admin"]);

  return <form
    action={updateOrderStatusAction}
    className="space-y-4"
    onSubmit={(event) => {
      if (nextStatus !== currentStatus && terminalStatuses.has(nextStatus)) {
        const accepted = window.confirm(`Konfirmasi perubahan status menjadi “${nextStatus}”? Tindakan ini akan dicatat pada riwayat pesanan.`);
        if (!accepted) event.preventDefault();
      }
    }}
  >
    <input name="orderId" type="hidden" value={orderId} />
    <label className="block text-xs font-semibold text-muted">
      Status berikutnya
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-foreground"
        name="nextStatus"
        onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
        value={nextStatus}
      >
        {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </label>
    <label className="block text-xs font-semibold text-muted">
      Catatan perubahan (opsional)
      <textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-foreground" maxLength={1000} name="statusNote" placeholder="Alasan atau konteks perubahan status" />
    </label>
    <SubmitButton>Simpan status</SubmitButton>
  </form>;
}

export function PaymentConfirmationForm({
  orderId,
  total,
  minimumDp,
  paymentAmount,
  paymentStatus,
  paymentNote,
}: {
  orderId: string;
  total: number;
  minimumDp: number;
  paymentAmount: number;
  paymentStatus: string;
  paymentNote: string | null;
}) {
  const initialState = paymentStatus === "paid" ? "paid" : paymentStatus === "dp_verified" ? "dp" : "unpaid";
  const [state, setState] = useState(initialState);
  const [amount, setAmount] = useState(paymentAmount);

  return <form action={confirmPaymentAction} className="space-y-4">
    <input name="orderId" type="hidden" value={orderId} />
    <label className="block text-xs font-semibold text-muted">
      Status pembayaran
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-foreground"
        name="paymentState"
        onChange={(event) => {
          const value = event.target.value;
          setState(value);
          if (value === "unpaid") setAmount(0);
          if (value === "dp") setAmount(Math.max(minimumDp, Math.min(amount || minimumDp, Math.max(minimumDp, total - 1))));
          if (value === "paid") setAmount(total);
        }}
        value={state}
      >
        <option value="unpaid">Belum Dibayar</option>
        <option value="dp">DP Diterima</option>
        <option value="paid">Lunas</option>
      </select>
    </label>
    <label className="block text-xs font-semibold text-muted">
      Nominal diterima
      <input
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-foreground"
        max={total}
        min={0}
        name="paymentAmount"
        onChange={(event) => setAmount(Number(event.target.value))}
        required
        step={1}
        type="number"
        value={amount}
      />
    </label>
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs leading-6 text-muted">
      <p>DP minimum: <strong className="text-foreground">{formatAdminCurrency(minimumDp)}</strong></p>
      <p>Sisa setelah pembayaran: <strong className="text-foreground">{formatAdminCurrency(Math.max(total - amount, 0))}</strong></p>
    </div>
    <label className="block text-xs font-semibold text-muted">
      Catatan pembayaran (opsional)
      <textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-foreground" defaultValue={paymentNote ?? ""} maxLength={1000} name="paymentNote" placeholder="Contoh: Transfer QRIS telah dicocokkan" />
    </label>
    <SubmitButton>Konfirmasi Pembayaran</SubmitButton>
  </form>;
}

export function DesignFileDownloadButton({ fileId }: { fileId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return <div>
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-foreground hover:border-copper hover:text-copper disabled:opacity-60"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch(`/api/admin/design-files/${fileId}/signed-url`, { method: "POST" });
          const payload = await response.json() as { url?: string; error?: string };
          if (!response.ok || !payload.url) throw new Error(payload.error || "File belum dapat dibuka.");
          window.open(payload.url, "_blank", "noopener,noreferrer");
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "File belum dapat dibuka.");
        } finally {
          setLoading(false);
        }
      }}
      type="button"
    >
      {loading ? <LoaderCircle className="animate-spin" size={15} /> : <Download size={15} />}
      {loading ? "Menyiapkan…" : "Unduh aman"}
    </button>
    {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}
  </div>;
}
