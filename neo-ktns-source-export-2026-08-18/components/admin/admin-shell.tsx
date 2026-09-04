import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { AdminLinks } from "@/components/admin/admin-links";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AdminShell({
  children,
  identity,
}: React.PropsWithChildren<{ identity: string }>) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-navy p-6 text-[#f6f4ef] lg:flex">
      <Link className="flex items-center gap-3" href="/admin">
        <span className="grid size-9 place-items-center rounded-full border border-[#c5a46d] text-[11px] font-bold tracking-widest">NK</span>
        <span className="text-sm font-semibold tracking-[.18em]">NEO KTNS</span>
      </Link>
      <p className="mt-2 pl-12 text-[10px] uppercase tracking-[.16em] text-white/45">Administration</p>
      <div className="mt-9"><AdminLinks /></div>
      <form action={signOutAction} className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white" type="submit"><LogOut size={17} />Keluar</button>
      </form>
    </aside>
    <main className="min-w-0">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_94%,transparent)] px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-3"><AdminMobileNav /><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-copper">Neo KTNS Admin</p><p className="hidden text-xs text-muted sm:block">Secure operations workspace</p></div></div>
        <div className="flex items-center gap-2 sm:gap-3"><ThemeToggle /><div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs sm:flex"><ShieldCheck size={15} className="text-copper" /><span className="max-w-40 truncate">{identity}</span></div><form action={signOutAction}><button aria-label="Keluar" className="grid size-10 place-items-center rounded-xl border border-[var(--border)] text-muted hover:border-copper hover:text-copper" type="submit"><LogOut size={17} /></button></form></div>
      </header>
      <div className="p-5 sm:p-8 lg:p-10">{children}</div>
    </main>
  </div>;
}
