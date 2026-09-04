"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export function TrackOrderForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [orderId, setOrderId] = useState("");
  const message = encodeURIComponent(`Hello Neo KTNS, saya ingin mengecek status pesanan ${orderId || "saya"}.`);
  return <div className="max-w-xl border-y border-[var(--border)] py-7 sm:py-9"><FormField label="Order ID" name="orderId" onChange={(event) => setOrderId(event.target.value)} placeholder="Contoh: NKTNS-20260803-001" value={orderId} /><ButtonLink className="mt-5 w-full" href={`https://wa.me/${whatsappNumber}?text=${message}`}><MessageCircle className="mr-2" size={17} />Chat admin untuk cek status</ButtonLink><p className="mt-4 text-xs leading-6 text-muted">Status pesanan dikonfirmasi langsung oleh admin. Halaman ini tidak menampilkan live tracking.</p></div>;
}
