"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/admin/auth";

export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Layanan login sedang tidak tersedia. Silakan coba lagi." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || !password) return { error: "Email atau password tidak valid." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email atau password tidak valid." };

  // Sign-in only establishes identity. Authorization is a separate, active
  // admin_users check performed from the server-bound session.
  const access = await getAdminAccess();
  if (access.kind !== "admin") {
    await supabase.auth.signOut();
    return { error: "Akun ini tidak memiliki akses admin." };
  }
  redirect("/admin");
}
