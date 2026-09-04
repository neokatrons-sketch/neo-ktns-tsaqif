import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerPublicSupabaseConfig, isSupabaseServerConfigured } from "@/lib/supabase/server-config";

export async function createServerSupabaseClient() {
  if (!await isSupabaseServerConfigured()) return null;
  const { url, anonKey } = await getServerPublicSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot always write cookies; actions and routes can.
        }
      },
    },
  });
}
