import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminProfile = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
};

export type AdminAccess =
  | { kind: "admin"; user: { id: string; email?: string | null }; admin: AdminProfile }
  | { kind: "unauthenticated" | "not_admin" | "unavailable" };

/**
 * Validates the Supabase Auth JWT on the server, then independently verifies
 * that the user is an active row in admin_users. Authenticated customers never
 * become administrators merely by having a valid Supabase session.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { kind: "unavailable" };

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { kind: "unauthenticated" };

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("user_id,email,display_name,role,is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    // Default deny on an RLS/schema/runtime error. Do not surface database
    // details to a browser route or treat a failed authorization query as admin.
    if (error) return { kind: "unavailable" };
    if (!admin) return { kind: "not_admin" };

    return { kind: "admin", user, admin };
  } catch {
    return { kind: "unavailable" };
  }
}

/** Backward-compatible convenience alias for server pages. */
export async function getAdminSession() {
  const access = await getAdminAccess();
  return access.kind === "admin" ? access : null;
}
