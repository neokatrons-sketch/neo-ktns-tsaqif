type SupabaseRuntimeEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

async function getRuntimeEnv() {
  try {
    const workerRuntime = await import("cloudflare:workers");
    return workerRuntime.env as SupabaseRuntimeEnv;
  } catch {
    // Local artifact verification does not inject production bindings. Runtime
    // callers still default-deny or use their documented non-critical fallback.
    return {} as SupabaseRuntimeEnv;
  }
}

export async function isSupabaseServerConfigured() {
  const runtimeEnv = await getRuntimeEnv();
  return Boolean(
    runtimeEnv.NEXT_PUBLIC_SUPABASE_URL &&
      runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getServerPublicSupabaseConfig() {
  const runtimeEnv = await getRuntimeEnv();
  const url = runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase public runtime environment is not configured.");
  return { url, anonKey };
}

export async function getServiceSupabaseConfig() {
  const runtimeEnv = await getRuntimeEnv();
  const url = runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase service runtime environment is not configured.");
  return { url, serviceRoleKey };
}
