import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAdminAccess } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin Login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.kind === "admin") redirect("/admin");
  if (access.kind === "not_admin") redirect("/admin/access-denied");

  return <main className="grid min-h-screen lg:grid-cols-2"><section className="flex min-h-[100svh] flex-col px-5 py-6 sm:px-10 lg:px-16"><div className="flex items-center justify-between"><Link className="inline-flex items-center gap-2 text-sm text-muted" href="/"><ArrowLeft size={16} />Kembali ke website</Link><ThemeToggle /></div><div className="my-auto w-full max-w-md py-16"><p className="eyebrow">Protected access</p><h1 className="editorial mt-5 text-5xl leading-none">Admin workspace.</h1><p className="mt-5 text-sm leading-7 text-muted">Masuk dengan akun yang telah didaftarkan sebagai admin aktif Neo KTNS.</p><AdminLoginForm /><p className="mt-5 text-xs leading-5 text-muted">Tidak tersedia pendaftaran admin publik. Hak akses diberikan secara manual oleh pengelola.</p></div></section><section className="product-canvas piqué-texture relative hidden overflow-hidden p-10 text-white lg:block"><div className="absolute inset-10 flex flex-col justify-between rounded-[2rem] border border-white/15 p-10"><div><span className="text-xs uppercase tracking-[.18em] text-white/50">Neo operations</span><p className="editorial mt-4 max-w-lg text-5xl leading-none">Precision behind every stitch.</p></div><div className="stitch-line h-px opacity-50" /><p className="max-w-sm text-sm leading-7 text-white/60">A clear workflow from design review to production and quality control.</p></div></section></main>;
}
