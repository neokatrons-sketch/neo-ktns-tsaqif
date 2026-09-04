import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerPublicSupabaseConfig } from "@/lib/supabase/server-config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = await getServerPublicSupabaseConfig();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Validate and refresh the server session when a refresh token remains
    // eligible. Invalid or expired sessions are rejected by protected routes.
    await supabase.auth.getUser();
  } catch {
    // Fail closed in the protected layout/API if runtime auth is unavailable.
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
