"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  ["Collection", "/collection"],
  ["How to Custom", "/how-to-custom"],
  ["Size Guide", "/size-guide"],
  ["Our Story", "/our-story"],
  ["FAQ", "/faq"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => toggleRef.current?.focus());
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);
    window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>("a")?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4" data-site-header>
      <Container className="site-header-shell glass-surface flex h-[68px] items-center justify-between gap-4 rounded-full px-4 sm:px-5">
        <Link className="group flex items-center gap-3" href="/" onClick={() => setOpen(false)}>
          <span className="grid size-9 place-items-center rounded-full border border-gold/80 text-[10px] font-bold tracking-[.14em] text-copper">NK</span>
          <span className="text-[13px] font-semibold tracking-[0.18em]">NEO KTNS</span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 lg:flex">
          {links.map(([label, href]) => <Link className="nav-link relative py-2 text-[13px] text-muted transition-colors hover:text-[var(--foreground)]" href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <ButtonLink className="nav-primary min-h-10 px-5 text-[13px]" href="/custom">Start Custom</ButtonLink>
        </div>
        <button aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? "Tutup navigasi" : "Buka navigasi"} className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] transition-colors hover:border-gold lg:hidden" onClick={() => setOpen(!open)} ref={toggleRef} type="button">
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </Container>
      {open && (
        <>
          <button aria-label="Tutup menu navigasi" className="mobile-menu-scrim fixed inset-0 top-0 z-[-1] bg-[#07131f]/55 lg:hidden" onClick={() => setOpen(false)} type="button" />
          <nav aria-label="Navigasi mobile" className="mobile-menu-panel fixed inset-x-3 top-[84px] mx-auto flex max-h-[calc(100dvh-96px)] max-w-[72rem] flex-col gap-1 overflow-y-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-[var(--foreground)] shadow-[0_22px_70px_rgba(7,19,31,.28)] sm:inset-x-4 lg:hidden" id="mobile-navigation" ref={menuRef}>
              {links.map(([label, href]) => <Link className="mobile-nav-link flex min-h-12 items-center rounded-xl px-4 text-sm font-medium transition-colors hover:bg-[var(--background)]" href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
              <Link className="mobile-nav-link flex min-h-12 items-center rounded-xl px-4 text-sm font-medium transition-colors hover:bg-[var(--background)]" href="/track-order" onClick={() => setOpen(false)}>Track Order</Link>
              <div className="mt-3 flex items-center gap-3 border-t border-[var(--border)] px-1 pt-4">
                <ThemeToggle />
                <ButtonLink className="flex-1" href="/custom">Start Custom</ButtonLink>
              </div>
          </nav>
        </>
      )}
    </header>
  );
}
