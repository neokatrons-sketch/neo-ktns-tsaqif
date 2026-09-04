"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminLinks } from "@/components/admin/admin-links";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return <>
    <button
      aria-controls="admin-mobile-navigation"
      aria-expanded={open}
      aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
      className="grid size-10 place-items-center rounded-xl border border-[var(--border)] lg:hidden"
      onClick={() => setOpen(true)}
      type="button"
    >
      <Menu size={19} />
    </button>
    {open && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi admin">
      <button aria-label="Tutup navigasi" className="absolute inset-0 bg-navy/45" onClick={() => setOpen(false)} type="button" />
      <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-navy p-5 text-[#f6f4ef] shadow-2xl" id="admin-mobile-navigation">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[.18em]">NEO KTNS</p>
          <button aria-label="Tutup navigasi" className="grid size-10 place-items-center rounded-xl text-white/70 hover:bg-white/10" onClick={() => setOpen(false)} type="button"><X size={20} /></button>
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-[.16em] text-white/45">Administration</p>
        <div className="mt-8"><AdminLinks currentPath={pathname} onNavigate={() => setOpen(false)} /></div>
      </aside>
    </div>}
  </>;
}
