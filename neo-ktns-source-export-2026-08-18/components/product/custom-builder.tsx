"use client";

import { ArrowRight, Check, Edit3, Minus, PackagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useOrderBuilder } from "@/components/order/order-builder-provider";
import { PlacementDiagram } from "@/components/product/placement-diagram";
import { Button, buttonStyles } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { SizeSelector } from "@/components/ui/size-selector";
import {
  colors as structuralColors,
  embroideryPackages as structuralPackages,
  getPlacementLabel,
  inferEmbroiderySelection,
  placements,
  type PlacementCode,
  type SizeCode,
} from "@/lib/catalog";
import { isOrderItemComplete, type OrderBuilderDraft, type OrderBuilderItem } from "@/lib/order-builder";
import type { PublicConfiguratorCatalog } from "@/lib/storefront/catalog";
import { cn, formatRupiah } from "@/lib/utils";

const placementGroups: ReadonlyArray<{ label: string; max: string; codes: readonly PlacementCode[] }> = [
  { label: "Depan", max: "Dada: maks. 7 × 7 cm", codes: ["left-chest", "right-chest"] },
  { label: "Lengan", max: "Lengan: maks. 7 × 7 cm", codes: ["left-sleeve", "right-sleeve"] },
  { label: "Belakang", max: "Belakang: maks. 26 × 14 cm", codes: ["back"] },
];

const allPlacementCodes = placements.map((placement) => placement.code);

function placementGuidance(candidate: readonly PlacementCode[]) {
  const chestCount = candidate.filter((code) => code === "left-chest" || code === "right-chest").length;
  const sleeveCount = candidate.filter((code) => code === "left-sleeve" || code === "right-sleeve").length;
  if (chestCount === 2 && sleeveCount === 0) return "Pilih satu area lengan sebelum menggunakan kedua area dada.";
  if (chestCount === 0 && sleeveCount === 2) return "Kombinasi kedua lengan tersedia bersama kedua area dada.";
  if (chestCount === 1 && sleeveCount === 1) return "Kombinasi 2 titik menggunakan 1 area dada + 1 area lengan pada sisi berlawanan.";
  if (chestCount === 1 && sleeveCount === 2) return "Tambahkan kedua area dada sebelum menggunakan kedua lengan.";
  return "Kombinasi posisi tersebut belum tersedia. Pilih placement yang mengikuti panduan produksi.";
}

function CheckoutAction({ disabled = false }: { disabled?: boolean }) {
  const content = <><span className="inline-flex items-center">Lanjut ke Checkout <ArrowRight className="ml-2" size={16} /></span><span className="text-[10px] font-medium text-white/70">Proceed to Checkout</span></>;
  if (disabled) return <Button className="h-auto w-full flex-col gap-0.5 py-3" disabled>{content}</Button>;
  return <a className={cn(buttonStyles(), "h-auto w-full flex-col gap-0.5 py-3")} href="/checkout">{content}</a>;
}

function StepLabel({ number, title, detail }: { number: string; title: string; detail?: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--copper-action)] text-[10px] font-bold text-white">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3>{detail && <p className="mt-0.5 text-[11px] text-muted">{detail}</p>}</div></div>;
}

export function CustomBuilder({ catalog }: { catalog: PublicConfiguratorCatalog }) {
  const { addLine, hydrated, lines, removeLine: removeStoredLine, updateLine } = useOrderBuilder();
  const colors = catalog.colors;
  const sizes = catalog.sizes.filter((size) => size.public);
  const embroideryPackages = catalog.packages.flatMap((databasePackage) => {
    const structural = structuralPackages.find((item) => item.code === databasePackage.code);
    return structural ? [{ ...structural, name: databasePackage.name, nameEn: databasePackage.nameEn, summary: databasePackage.summary }] : [];
  });
  const initialDraft = useMemo<OrderBuilderDraft>(() => {
    const initialPackage = embroideryPackages[0];
    return { colorSlug: colors[0].slug, size: sizes[0].code, packageCode: initialPackage.code, presetId: initialPackage.presets[0].id, quantity: 1 };
  }, [colors, embroideryPackages, sizes]);
  const [draft, setDraft] = useState<OrderBuilderDraft>(() => initialDraft);
  const [selectedPlacements, setSelectedPlacements] = useState<PlacementCode[]>([]);
  const [placementHelp, setPlacementHelp] = useState("Pilih satu posisi untuk memulai. Paket dan harga ditentukan otomatis.");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("Konfigurasi belum ditambahkan ke order.");

  const inferredSelection = inferEmbroiderySelection(selectedPlacements, embroideryPackages);
  const color = colors.find((item) => item.slug === draft.colorSlug)!;
  const inferredPackage = inferredSelection ? embroideryPackages.find((item) => item.code === inferredSelection.packageCode) ?? null : null;
  const getLinePrice = (line: OrderBuilderDraft) => {
    const unit = catalog.prices[`${line.packageCode}:${line.size}`] ?? 0;
    return { unit, subtotal: unit * line.quantity };
  };
  const draftPrice = inferredSelection ? getLinePrice(draft) : { unit: 0, subtotal: 0 };
  const orderSubtotal = lines.reduce((sum, line) => sum + getLinePrice(line).subtotal, 0);
  const totalPieces = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const activeColors = new Set(colors.map((item) => item.slug));
  const activeSizes = new Set(sizes.map((item) => item.code));
  const activePackages = new Set(embroideryPackages.map((item) => item.code));
  const selectionReady = Boolean(inferredSelection && inferredPackage && draftPrice.unit);
  const canCheckout = hydrated && lines.length > 0 && lines.every((line) => isOrderItemComplete(line) && activeColors.has(line.colorSlug) && activeSizes.has(line.size) && activePackages.has(line.packageCode) && Boolean(catalog.prices[`${line.packageCode}:${line.size}`]));

  function togglePlacement(code: PlacementCode) {
    const candidate = selectedPlacements.includes(code) ? selectedPlacements.filter((placement) => placement !== code) : [...selectedPlacements, code];
    if (!candidate.length) {
      setSelectedPlacements([]);
      setPlacementHelp("Pilih satu posisi untuk memulai. Paket dan harga ditentukan otomatis.");
      return;
    }
    const nextSelection = inferEmbroiderySelection(candidate, embroideryPackages);
    if (!nextSelection) {
      setPlacementHelp(placementGuidance(candidate));
      return;
    }
    setSelectedPlacements([...nextSelection.positions]);
    setDraft((current) => ({ ...current, packageCode: nextSelection.packageCode, presetId: nextSelection.presetId }));
    setPlacementHelp("Kombinasi valid. Paket dan estimasi harga sudah diperbarui otomatis.");
  }

  function addOrUpdateLine() {
    if (!selectionReady) {
      setPlacementHelp("Pilih kombinasi posisi bordir yang valid sebelum menambahkan item.");
      return;
    }
    if (editingId != null) {
      updateLine(editingId, draft);
      setNotice(`${color.name} / ${draft.size} berhasil diperbarui.`);
      setEditingId(null);
      return;
    }
    addLine(draft);
    setNotice(`${color.name} / ${draft.size} ditambahkan. Atur kombinasi berikutnya untuk menambah item lain.`);
    setDraft((current) => ({ ...current, quantity: 1 }));
  }

  function editLine(line: OrderBuilderItem) {
    const linePackage = embroideryPackages.find((item) => item.code === line.packageCode) ?? structuralPackages.find((item) => item.code === line.packageCode)!;
    const linePreset = linePackage.presets.find((item) => item.id === line.presetId) ?? linePackage.presets[0];
    setDraft({ colorSlug: line.colorSlug, size: line.size, packageCode: line.packageCode, presetId: line.presetId, quantity: line.quantity });
    setSelectedPlacements([...linePreset.positions]);
    setPlacementHelp("Kombinasi valid. Paket dan estimasi harga sudah diperbarui otomatis.");
    setEditingId(line.id);
    setNotice("Mode edit aktif. Simpan perubahan setelah konfigurasi selesai.");
    document.getElementById("item-configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeLine(id: string) {
    removeStoredLine(id);
    if (editingId === id) setEditingId(null);
    setNotice("Item dihapus dari order draft.");
  }

  function resetDraft() {
    setDraft(initialDraft);
    setSelectedPlacements([]);
    setPlacementHelp("Pilih satu posisi untuk memulai. Paket dan harga ditentukan otomatis.");
    setEditingId(null);
    setNotice("Konfigurasi direset ke pilihan awal.");
  }

  return (
    <div className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px] xl:items-start", (selectionReady || canCheckout) && "pb-32 xl:pb-0")}>
      <div id="item-configurator">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Line item / {String(lines.length + (editingId == null ? 1 : 0)).padStart(2, "0")}</p><h2 className="editorial mt-2 text-3xl sm:text-4xl">Build your polo, one clear choice at a time.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Pilih warna, ukuran, dan lokasi bordir. Paket produksi serta harga mengikuti otomatis.</p></div>
          <button className="inline-flex items-center gap-2 self-start text-xs font-semibold text-muted transition hover:text-copper" onClick={resetDraft} type="button"><RotateCcw size={14} /> Reset pilihan</button>
        </div>

        <section className="config-step">
          <StepLabel detail="Premium Piqué 24s · 200–220 gsm" number="01" title="Product" />
          <div className="mt-4 flex items-end justify-between gap-4 border-t border-[var(--border)] pt-4"><div><p className="font-semibold">{catalog.product.name}</p><p className="mt-1 text-xs text-muted">{catalog.product.nameEn}</p></div><span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-muted">Preorder</span></div>
        </section>

        <section className="config-step">
          <StepLabel detail={color.nameEn} number="02" title="Color" />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{colors.map((item) => <ColorSwatch hex={item.hex} key={item.slug} name={item.name} onClick={() => setDraft((current) => ({ ...current, colorSlug: item.slug }))} selected={draft.colorSlug === item.slug} />)}</div>
        </section>

        <section className="config-step">
          <div className="flex items-center justify-between gap-4"><StepLabel number="03" title="Size" /><a className="text-xs font-medium text-copper underline-offset-4 hover:underline" href="/size-guide">Size guide</a></div>
          <div className="mt-4"><SizeSelector onChange={(value) => setDraft((current) => ({ ...current, size: value as SizeCode }))} selected={draft.size} sizes={sizes.map((item) => item.code)} /></div>
          {!sizes.some((item) => item.code === "XXL") && <p className="mt-3 text-xs leading-5 text-muted">XXL belum tersedia pada pilihan publik saat ini.</p>}
        </section>

        <section className="config-step">
          <div><StepLabel detail="Pilih lokasi langsung; paket ditentukan sistem" number="04" title="Posisi Bordir" /></div>
          <div className="mt-5 grid overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-5 p-5 sm:p-6">
              {placementGroups.map((group) => (
                <fieldset key={group.label}>
                  <legend className="sr-only">{group.label}</legend>
                  <div className="mb-2 flex items-center justify-between gap-4"><span aria-hidden="true" className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">{group.label}</span><span className="text-[10px] text-muted">{group.max}</span></div>
                  <div className="flex flex-wrap gap-2">{group.codes.map((code) => {
                    const placement = placements.find((item) => item.code === code)!;
                    const selected = selectedPlacements.includes(code);
                    return <button aria-pressed={selected} className={cn("min-h-11 rounded-xl border px-3.5 py-2 text-xs font-semibold transition", selected ? "border-copper bg-[var(--copper-action)] text-white shadow-[0_6px_18px_rgba(181,106,60,.18)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-gold")} key={code} onClick={() => togglePlacement(code)} type="button">{placement.label}</button>;
                  })}</div>
                </fieldset>
              ))}
              <div className="border-t border-[var(--border)] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">Selected positions</p><p className="mt-1.5 text-sm font-semibold">{selectedPlacements.length ? selectedPlacements.map(getPlacementLabel).join(" • ") : "Belum dipilih"}</p><p aria-live="polite" className={cn("mt-2 text-xs leading-5", selectionReady ? "text-muted" : "text-copper")}>{placementHelp}</p></div>
            </div>
            <div className="placement-stage border-t border-[var(--border)] p-5 lg:border-l lg:border-t-0"><p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Placement guide</p><PlacementDiagram active={selectedPlacements} available={allPlacementCodes} /></div>
          </div>
        </section>

        <section className="config-step">
          <div className="flex items-center justify-between gap-5"><StepLabel detail="Untuk kombinasi ini" number="05" title="Quantity" /><div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] p-1"><button aria-label="Kurangi jumlah" className="grid size-9 place-items-center rounded-full transition hover:bg-[var(--surface)]" onClick={() => setDraft((current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))} type="button"><Minus size={14} /></button><span className="w-12 text-center text-sm font-semibold">{draft.quantity}</span><button aria-label="Tambah jumlah" className="grid size-9 place-items-center rounded-full transition hover:bg-[var(--surface)]" onClick={() => setDraft((current) => ({ ...current, quantity: current.quantity + 1 }))} type="button"><Plus size={14} /></button></div></div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-28">
        <section className="product-canvas piqué-texture overflow-hidden rounded-[var(--radius-lg)] border border-white/10 p-5 text-white shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-[var(--copper-action)] text-[10px] font-bold text-white">06</span><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/60">Estimated price</p></div>
          <p className="editorial mt-4 text-4xl">{selectionReady ? formatRupiah(draftPrice.unit) : "—"}</p>
          <dl className="mt-5 space-y-3 border-t border-white/15 pt-4 text-xs"><div className="flex justify-between gap-4 text-white/70"><dt>Product</dt><dd>{color.name} / {draft.size}</dd></div><div className="flex justify-between gap-4 text-white/70"><dt>Selected positions</dt><dd className="max-w-[65%] text-right">{selectedPlacements.length ? selectedPlacements.map(getPlacementLabel).join(" • ") : "Belum dipilih"}</dd></div><div className="flex justify-between gap-4 text-white/70"><dt>Automatically determined package</dt><dd className="text-right">{inferredPackage?.name ?? "—"}</dd></div><div className="flex items-end justify-between gap-4 border-t border-white/15 pt-3"><dt className="text-white/65">{draft.quantity} pcs × {selectionReady ? formatRupiah(draftPrice.unit) : "—"}</dt><dd className="text-lg font-bold">{selectionReady ? formatRupiah(draftPrice.subtotal) : "—"}</dd></div></dl>
        </section>

        <section className="glass-surface rounded-[var(--radius-lg)] p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Order builder</p><h3 className="mt-2 font-semibold">Your configurations</h3></div><span className="text-xs font-semibold text-muted">{totalPieces} pcs</span></div>
          {lines.length ? <div className="mt-5 space-y-3">{lines.map((line, index) => {
            const lineColor = colors.find((item) => item.slug === line.colorSlug) ?? structuralColors.find((item) => item.slug === line.colorSlug)!;
            const linePackage = embroideryPackages.find((item) => item.code === line.packageCode) ?? structuralPackages.find((item) => item.code === line.packageCode)!;
            const linePreset = linePackage.presets.find((item) => item.id === line.presetId) ?? linePackage.presets[0];
            const price = getLinePrice(line);
            const unavailable = !activeColors.has(line.colorSlug) || !activeSizes.has(line.size) || !activePackages.has(line.packageCode) || !price.unit;
            return <article className={cn("rounded-2xl border p-4", editingId === line.id ? "border-copper" : "border-[var(--border)]")} key={line.id}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="mt-0.5 size-5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: lineColor.hex }} /><div className="min-w-0"><p className="text-xs font-semibold">{index + 1}. {lineColor.name} / {line.size}</p><p className="mt-1 text-[11px] leading-5 text-muted">{linePreset.positions.map(getPlacementLabel).join(" • ")}</p><p className="mt-0.5 text-[10px] text-muted">{linePackage.name}</p>{unavailable && <p className="mt-1 text-[10px] font-semibold text-red-700">Tidak tersedia untuk order baru</p>}</div></div><div className="flex shrink-0 gap-1"><button aria-label={`Edit item ${index + 1}`} className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-[var(--background)] hover:text-copper disabled:cursor-not-allowed disabled:opacity-35" disabled={unavailable} onClick={() => editLine(line)} type="button"><Edit3 size={13} /></button><button aria-label={`Hapus item ${index + 1}`} className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-[var(--background)] hover:text-red-700" onClick={() => removeLine(line.id)} type="button"><Trash2 size={13} /></button></div></div><div className="mt-3 flex items-end justify-between gap-3 border-t border-[var(--border)] pt-3"><span className="text-[11px] text-muted">{line.quantity} × {formatRupiah(price.unit)}</span><strong className="text-sm">{formatRupiah(price.subtotal)}</strong></div></article>;
          })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-center"><p className="text-xs font-semibold">Belum ada line item</p><p className="mt-1 text-[11px] leading-5 text-muted">Pilih posisi valid, lalu tambahkan ke order.</p></div>}
          <div className="mt-5 border-t border-[var(--border)] pt-5"><div className="flex items-end justify-between gap-4"><span className="text-sm text-muted">Running subtotal</span><strong className="editorial text-2xl">{formatRupiah(orderSubtotal)}</strong></div><p className="mt-3 text-xs leading-5 text-muted">Ongkir dan total akhir dikonfirmasi admin. Estimasi memakai harga jual aktif.</p></div>
        </section>

        <section className="hidden space-y-3 xl:block"><Button className="w-full" disabled={!selectionReady} onClick={addOrUpdateLine} variant="secondary">{editingId != null ? <><Check className="mr-2" size={17} />Simpan perubahan</> : <><PackagePlus className="mr-2" size={17} />{lines.length ? "Add another item" : "Add item to order"}</>}</Button><CheckoutAction disabled={!canCheckout} /><p aria-live="polite" className="px-2 text-center text-xs leading-5 text-muted">{notice}</p></section>
      </aside>

      {(selectionReady || canCheckout) && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color:var(--surface)]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(15,34,56,0.12)] backdrop-blur xl:hidden"><div className="mx-auto max-w-lg"><div className="mb-2 flex items-center justify-between gap-4"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">Estimated unit</span><strong className="text-sm">{selectionReady ? formatRupiah(draftPrice.unit) : "Pilih posisi"}</strong></div><div className={cn("grid gap-2", canCheckout && "grid-cols-2")}><Button className="w-full px-3" disabled={!selectionReady} onClick={addOrUpdateLine} variant="secondary">{editingId != null ? "Simpan" : lines.length ? "Tambah item" : "Add to order"}</Button>{canCheckout && <a className={cn(buttonStyles(), "w-full px-3")} href="/checkout">Checkout <ArrowRight className="ml-1" size={15} /></a>}</div><p aria-live="polite" className="sr-only">{notice}</p></div></div>}
    </div>
  );
}
