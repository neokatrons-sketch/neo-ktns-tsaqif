import { ShieldX } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { Button, buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Admin Access Denied" };
export const dynamic = "force-dynamic";

export default function AdminAccessDeniedPage() {
  return <main className="grid min-h-[100svh] place-items-center px-5 py-12"><section className="surface w-full max-w-lg rounded-[var(--radius-lg)] p-7 text-center shadow-[var(--shadow-soft)] sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-500/10 text-[var(--danger)]"><ShieldX aria-hidden="true" size={26} /></span><p className="eyebrow mt-6">Access denied</p><h1 className="editorial mt-3 text-4xl">Akun bukan admin aktif.</h1><p className="mt-4 text-sm leading-7 text-muted">Sesi Supabase valid, tetapi akun ini tidak terdaftar sebagai administrator aktif Neo KTNS.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><form action={signOutAction}><Button className="w-full sm:w-auto" type="submit">Keluar dengan aman</Button></form><Link className={buttonStyles("secondary")} href="/">Kembali ke website</Link></div></section></main>;
}
