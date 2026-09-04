import { createClient } from "@supabase/supabase-js";
import { getServiceSupabaseConfig } from "@/lib/supabase/server-config";

export async function createServiceSupabaseClient() {
  const { url, serviceRoleKey } = await getServiceSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
