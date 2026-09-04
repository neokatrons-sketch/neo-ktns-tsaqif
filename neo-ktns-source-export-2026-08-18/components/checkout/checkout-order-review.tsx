"use client";

import { ArrowLeft, CheckCircle2, FileUp, MessageCircle, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOrderBuilder } from "@/components/order/order-builder-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { colors, getEmbroideryPackage } from "@/lib/catalog";
import { getOrderLinePrice, isOrderItemComplete } from "@/lib/order-builder";
import type { PublicPriceMap } from "@/lib/public-pricing";
import { cn, formatRupiah } from "@/lib/utils";
import type { BusinessSettings } from "@/lib/business-settings";

const MAX_DESIGN_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_DESIGN_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "svg", "psd", "eps", "cdr"];
const CHECKOUT_IDEMPOTENCY_KEY = "neo-ktns-checkout-idempotency-v1";
const WHATSAPP_RECOVERY_KEY = "neo-ktns-whatsapp-recovery-v1";

const controlStyles = "min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-base outline-none transition placeholder:text-muted/70 focus:border-copper";

type AppliedPromo = { code: string; discountAmount: number; subtotalAfterDiscount: number };
type WhatsAppRecovery = { orderId: string; idempotencyKey: string };

export function CheckoutOrderReview({ prices, settings }: { prices: PublicPriceMap | null; settings: BusinessSettings }) {
  const { hydrated, lines } = useOrderBuilder();
  const [designFilename, setDesignFilename] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitWarning, setSubmitWarning] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "uploading" | "finalizing" | "failed">("idle");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoState, setPromoState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [whatsappRecovery, setWhatsappRecovery] = useState<WhatsAppRecovery | null>(null);
  const idempotencyRef = useRef("");

  useEffect(() => {
    let frame: number | undefined;
    try {
      const stored = window.sessionStorage.getItem(WHATSAPP_RECOVERY_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<WhatsAppRecovery>;
      if (typeof parsed.orderId === "string" && typeof parsed.idempotencyKey === "string") {
        frame = window.requestAnimationFrame(() => {
          setWhatsappRecovery({ orderId: parsed.orderId!, idempotencyKey: parsed.idempotencyKey! });
        });
      }
    } catch {
      window.sessionStorage.removeItem(WHATSAPP_RECOVERY_KEY);
    }
    return () => { if (frame != null) window.cancelAnimationFrame(frame); };
  }, []);

  function handleDesignFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setFileError("");
    setDesignFilename("");
    setDesignFile(null);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_DESIGN_EXTENSIONS.includes(extension)) {
      setFileError("Format tidak didukung. Gunakan PNG, JPG, JPEG, PDF, SVG, PSD, EPS, atau CDR.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_DESIGN_FILE_SIZE) {
      setFileError("Ukuran file melebihi batas maksimum 10 MB.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size < 1) {
      setFileError("File desain tidak boleh kosong.");
      event.currentTarget.value = "";
      return;
    }

    setDesignFilename(file.name);
    setDesignFile(file);
  }

  function getIdempotencyKey() {
    if (idempotencyRef.current) return idempotencyRef.current;
    const stored = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY);
    const key = stored || crypto.randomUUID();
    window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY, key);
    idempotencyRef.current = key;
    return key;
  }

  async function handlePromoApply() {
    const code = promoCode.trim();
    setAppliedPromo(null);
    setPromoMessage("");
    if (!code) {
      setPromoState("invalid");
      setPromoMessage("Masukkan kode promo terlebih dahulu.");
      return;
    }
    try {
      setPromoState("checking");
      const response = await fetch("/api/checkout/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          promoCode: code,
          items: validLines.map((line) => ({ ...line, placementCodes: getEmbroideryPackage(line.packageCode).presets.find((preset) => preset.id === line.presetId)?.positions ?? [] })),
        }),
      });
      const result = await response.json() as { error?: string; message?: string; code?: string; discountAmount?: number; subtotalAfterDiscount?: number };
      if (!response.ok || !result.code || result.discountAmount == null || result.subtotalAfterDiscount == null) {
        throw new Error(result.message || result.error || "Kode promo tidak valid atau tidak memenuhi syarat.");
      }
      setAppliedPromo({ code: result.code, discountAmount: result.discountAmount, subtotalAfterDiscount: result.subtotalAfterDiscount });
      setPromoCode(result.code);
      setPromoState("valid");
      setPromoMessage(result.message || "Promo berhasil digunakan.");
    } catch (error) {
      setPromoState("invalid");
      setPromoMessage(error instanceof Error ? error.message : "Kode promo tidak valid atau tidak memenuhi syarat.");
    }
  }

  async function handleCheckoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState !== "idle" && submitState !== "failed") return;
    if (!designFile) {
      setFileError("Pilih file desain sebelum mengirim pesanan.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const idempotencyKey = getIdempotencyKey();
    setSubmitWarning("");
    try {
      setSubmitState("saving");
      const preparedResponse = await fetch("/api/checkout/create", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          fullName: formData.get("fullName"), whatsappNumber: formData.get("whatsappNumber"), address: formData.get("address"),
          paymentMethod: formData.get("paymentMethod"), deliveryMethod: formData.get("deliveryMethod"), canvaUrl: formData.get("canvaLink"), customerNote: formData.get("orderNotes"),
          items: validLines.map((line) => ({ ...line, placementCodes: getEmbroideryPackage(line.packageCode).presets.find((preset) => preset.id === line.presetId)?.positions ?? [] })),
        }),
      });
      const prepared = await preparedResponse.json() as { error?: string; orderId?: string; uploadToken?: string; finalized?: boolean };
      if (!preparedResponse.ok || !prepared.orderId) throw new Error(prepared.error || "Pesanan belum dapat disimpan.");
      const recovery = { orderId: prepared.orderId, idempotencyKey };
      window.sessionStorage.setItem(WHATSAPP_RECOVERY_KEY, JSON.stringify(recovery));
      setWhatsappRecovery(recovery);

      if (!prepared.finalized) {
        if (!prepared.uploadToken) throw new Error("Sesi upload belum tersedia. Silakan coba lagi.");
        setSubmitState("uploading");
        const uploadData = new FormData();
        uploadData.set("orderId", prepared.orderId); uploadData.set("uploadToken", prepared.uploadToken); uploadData.set("file", designFile);
        const uploadResponse = await fetch("/api/design-files", { method: "POST", body: uploadData });
        const upload = await uploadResponse.json() as { error?: string };
        if (!uploadResponse.ok) throw new Error(upload.error || "File desain belum dapat diunggah.");
      }

      setSubmitState("finalizing");
      const finalResponse = await fetch("/api/checkout/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: prepared.orderId, idempotencyKey, promoCode: appliedPromo?.code ?? null }) });
      const finalized = await finalResponse.json() as { error?: string; whatsappUrl?: string };
      if (!finalResponse.ok || !finalized.whatsappUrl) throw new Error(finalized.error || "Pesanan belum dapat difinalisasi.");
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
      window.location.assign(finalized.whatsappUrl);
    } catch (error) {
      setSubmitState("failed");
      setSubmitWarning(error instanceof Error ? error.message : "Pesanan belum dapat diproses. Silakan coba lagi.");
    }
  }

  async function handleWhatsAppRecovery() {
    if (!whatsappRecovery || (submitState !== "idle" && submitState !== "failed")) return;
    setSubmitWarning("");
    try {
      setSubmitState("finalizing");
      const response = await fetch("/api/checkout/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...whatsappRecovery, promoCode: null }),
      });
      const result = await response.json() as { error?: string; whatsappUrl?: string };
      if (!response.ok || !result.whatsappUrl) throw new Error(result.error || "WhatsApp belum dapat dibuka kembali.");
      window.location.assign(result.whatsappUrl);
    } catch (error) {
      setSubmitState("failed");
      setSubmitWarning(error instanceof Error ? error.message : "WhatsApp belum dapat dibuka kembali.");
    }
  }

  if (!hydrated) {
    return (
      <div className="surface rounded-[var(--radius-lg)] p-8 text-center">
        <p className="text-sm font-semibold">Memuat konfigurasi…</p>
        <p className="mt-2 text-xs text-muted">Loading your order builder.</p>
      </div>
    );
  }

  const validLines = lines.filter(isOrderItemComplete);

  if (!validLines.length) {
    return (
      <div className="surface rounded-[var(--radius-lg)] px-6 py-14 text-center sm:px-10">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--background)] text-copper">
          <ShoppingBag size={20} />
        </span>
        <h2 className="editorial mt-5 text-3xl">Belum ada konfigurasi.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Tambahkan setidaknya satu kombinasi polo yang lengkap sebelum melanjutkan checkout.
        </p>
        <a className={cn(buttonStyles(), "mt-6")} href="/custom">Kembali ke configurator</a>
      </div>
    );
  }

  const pricedLines = prices == null ? [] : validLines.map((line) => getOrderLinePrice(line, prices));
  if (prices == null || pricedLines.some((price) => price == null)) {
    return (
      <div className="surface rounded-[var(--radius-lg)] px-6 py-12 text-center sm:px-10">
        <h2 className="editorial text-3xl">Harga aktif belum dapat dimuat.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">Konfigurasi tetap tersimpan di perangkat ini. Muat ulang halaman atau kembali ke configurator setelah koneksi pulih.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button className={buttonStyles()} onClick={() => window.location.reload()} type="button">Muat ulang</button>
          <a className={buttonStyles("secondary")} href="/custom">Kembali ke configurator</a>
        </div>
      </div>
    );
  }

  const subtotal = pricedLines.reduce((sum, price) => sum + price!.subtotal, 0);
  const totalPieces = validLines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:items-start">
      <section>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <p className="eyebrow">Configured items</p>
            <h2 className="editorial mt-2 text-3xl">Review your order.</h2>
          </div>
          <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-muted">
            {totalPieces} pcs
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {validLines.map((line, index) => {
            const color = colors.find((item) => item.slug === line.colorSlug)!;
            const embroideryPackage = getEmbroideryPackage(line.packageCode);
            const preset = embroideryPackage.presets.find((item) => item.id === line.presetId)!;
            const price = pricedLines[index]!;

            return (
              <article className="py-5 sm:py-6" key={line.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className="mt-0.5 size-6 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{index + 1}. {color.name} · Size {line.size}</p>
                      <p className="mt-1 text-xs text-muted">{preset.label}</p>
                      <p className="mt-1 text-[10px] text-muted">Mapped package: {embroideryPackage.name}</p>
                    </div>
                  </div>
                  <strong className="shrink-0 text-sm">{formatRupiah(price.subtotal)}</strong>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-xs sm:grid-cols-2">
                  <div><dt className="text-muted">Quantity</dt><dd className="mt-1 font-semibold">{line.quantity} pcs</dd></div>
                  <div><dt className="text-muted">Estimated unit</dt><dd className="mt-1 font-semibold">{formatRupiah(price.unit)}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>

        <a className={cn(buttonStyles("secondary"), "mt-6")} href="/custom">
          <ArrowLeft className="mr-2" size={16} /> Kembali mengedit
        </a>
      </section>

      <aside className="glass-surface rounded-[var(--radius-lg)] p-5 sm:p-7">
        <p className="eyebrow">Checkout summary</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <span className="text-sm text-muted">Subtotal</span>
          <strong className="editorial text-3xl">{formatRupiah(subtotal)}</strong>
        </div>
        {appliedPromo && <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4 text-sm"><div className="flex justify-between gap-3 text-copper"><span>Promo {appliedPromo.code}</span><strong>-{formatRupiah(appliedPromo.discountAmount)}</strong></div><div className="flex items-end justify-between gap-3"><span className="text-muted">Subtotal baru</span><strong className="text-lg">{formatRupiah(appliedPromo.subtotalAfterDiscount)}</strong></div></div>}
        <p className="mt-3 text-xs leading-5 text-muted">Ongkir dan total akhir akan dikonfirmasi admin.</p>
        <div className="mt-6 border-y border-[var(--border)] py-4">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-copper" size={17} />
            <p className="text-xs leading-5 text-muted">
              Semua line item tetap tersimpan. Data pemesan dan file desain akan diproses pada tahap submission checkout.
            </p>
          </div>
        </div>

        <form className="mt-7 border-t border-[var(--border)] pt-7" onSubmit={handleCheckoutSubmit}>
          <div className="border-b border-[var(--border)] pb-6">
            <label className="text-xs font-semibold" htmlFor="checkout-promo-code">Punya kode promo?</label>
            <div className="mt-2 flex gap-2">
              <input autoCapitalize="characters" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm uppercase outline-none focus:border-copper" id="checkout-promo-code" maxLength={32} onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setAppliedPromo(null); setPromoMessage(""); setPromoState("idle"); }} placeholder="Kode promo" value={promoCode} />
              <button className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-xs font-semibold text-copper hover:border-copper disabled:opacity-50" disabled={promoState === "checking"} onClick={handlePromoApply} type="button">{promoState === "checking" ? "Memeriksa…" : "Gunakan"}</button>
            </div>
            {promoMessage && <p className={`mt-2 text-xs leading-5 ${promoState === "valid" ? "text-emerald-700" : "text-[var(--danger)]"}`} role={promoState === "valid" ? "status" : "alert"}>{promoMessage}</p>}
          </div>

          <div>
            <p className="eyebrow mt-7">Customer details</p>
            <h3 className="editorial mt-2 text-2xl">Lengkapi data pesanan.</h3>
            <p className="mt-2 text-xs leading-5 text-muted">Data ini digunakan admin untuk memeriksa desain, pembayaran, dan metode penerimaan.</p>
          </div>

          <div className="mt-6 space-y-5">
            <FormField autoComplete="name" label="Nama lengkap" name="fullName" placeholder="Nama penerima" required />
            <FormField autoComplete="tel" inputMode="tel" label="Nomor WhatsApp" name="whatsappNumber" placeholder="Contoh: 085725935431" required type="tel" />

            <label className="block" htmlFor="checkout-address">
              <span className="mb-2 block text-sm font-medium">Alamat</span>
              <textarea className={cn(controlStyles, "min-h-28 resize-y py-3")} id="checkout-address" name="address" placeholder="Alamat lengkap atau detail titik temu" required />
            </label>

            <label className="block" htmlFor="checkout-payment-method">
              <span className="mb-2 block text-sm font-medium">Metode pembayaran</span>
              <select className={controlStyles} defaultValue="" id="checkout-payment-method" name="paymentMethod" required>
                <option disabled value="">Pilih metode pembayaran</option>
                {settings.paymentMethods.filter((option) => option.enabled).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {settings.qrisInformation && <span className="mt-2 block text-[11px] leading-5 text-muted">Info QRIS: {settings.qrisInformation}</span>}
            </label>

            <label className="block" htmlFor="checkout-delivery-method">
              <span className="mb-2 block text-sm font-medium">Metode penerimaan</span>
              <select className={controlStyles} defaultValue="" id="checkout-delivery-method" name="deliveryMethod" required>
                <option disabled value="">Pilih metode penerimaan</option>
                {settings.deliveryMethods.filter((option) => option.enabled).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className="mt-2 block text-[11px] leading-5 text-muted">{settings.pickupNotice}</span>
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium">Design file</span>
              <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-4 transition hover:border-gold" htmlFor="checkout-design-file">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-copper"><FileUp size={17} /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Pilih file desain</span>
                  <span className="mt-1 block text-[11px] leading-5 text-muted">PNG, JPG, JPEG, PDF, SVG, PSD, EPS, CDR · maks. 10 MB</span>
                </span>
                <input accept=".png,.jpg,.jpeg,.pdf,.svg,.psd,.eps,.cdr" className="sr-only" id="checkout-design-file" name="designFile" onChange={handleDesignFile} required type="file" />
              </label>
              {designFilename && <p className="mt-2 truncate text-xs font-semibold text-copper">{designFilename}</p>}
              {fileError && <p className="mt-2 text-xs leading-5 text-[var(--danger)]" role="alert">{fileError}</p>}
              <p className="mt-2 text-[11px] leading-5 text-muted">Gunakan file resolusi tinggi dan tidak pecah. PNG transparan direkomendasikan. File dengan background tetap boleh dikirim dan akan diperiksa admin.</p>
            </div>

            <FormField label="Canva editable link (opsional)" name="canvaLink" placeholder="https://www.canva.com/design/..." type="url" />

            <label className="block" htmlFor="checkout-order-notes">
              <span className="mb-2 block text-sm font-medium">Catatan pesanan (opsional)</span>
              <textarea className={cn(controlStyles, "min-h-24 resize-y py-3")} id="checkout-order-notes" name="orderNotes" placeholder="Tambahkan informasi yang perlu diketahui admin" />
            </label>
          </div>

          <div className="mt-6 border-y border-[var(--border)] py-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-copper" size={17} />
              <div>
                <p className="text-xs font-semibold">Pesanan tersimpan dengan aman</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">Data order dan file desain disimpan sebelum WhatsApp dibuka.</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-5 text-muted">DP minimum {settings.minimumDpPercentage}% · batas pembayaran {settings.paymentDeadlineHours} jam · estimasi produksi minimum {settings.productionDaysMin} hari.</p>

          {submitWarning && <p className="mt-4 text-xs leading-5 text-[var(--danger)]" role="alert">{submitWarning}</p>}

          {whatsappRecovery && <button className={cn(buttonStyles("secondary"), "mt-5 w-full")} disabled={submitState === "saving" || submitState === "uploading" || submitState === "finalizing"} onClick={handleWhatsAppRecovery} type="button"><MessageCircle className="mr-2" size={18} /> Buka WhatsApp untuk pesanan terakhir</button>}

          <Button aria-describedby="checkout-submit-helper" className="mt-3 h-auto w-full flex-col gap-1 py-4 text-base" disabled={Boolean(fileError) || submitState === "saving" || submitState === "uploading" || submitState === "finalizing"} type="submit">
            <span className="inline-flex items-center"><MessageCircle className="mr-2" size={18} /> {submitState === "saving" ? "Menyimpan pesanan..." : submitState === "uploading" ? "Mengunggah desain..." : submitState === "finalizing" ? "Menyiapkan WhatsApp..." : submitState === "failed" ? "Coba lagi" : "Pesan via WhatsApp"}</span>
          </Button>
          <p className="mt-2 text-center text-[11px] leading-5 text-muted" id="checkout-submit-helper">Order data will be saved before WhatsApp opens.</p>
        </form>
      </aside>
    </div>
  );
}
