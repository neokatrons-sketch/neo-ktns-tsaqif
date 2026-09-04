import { getAdminAccess } from "@/lib/admin/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { DESIGN_BUCKET } from "@/lib/storage/design-files";

const SIGNED_URL_TTL_SECONDS = 60;

export type AdminDesignUrlResult =
  | { ok: true; url: string; expiresIn: number }
  | { ok: false; status: 401 | 403 | 404 | 503 };

/**
 * Resolves a single stored design file for an active admin and returns a
 * short-lived URL. The bucket remains private and the service key never leaves
 * this server-only module.
 */
export async function createAdminDesignFileSignedUrl(fileId: string): Promise<AdminDesignUrlResult> {
  const access = await getAdminAccess();
  if (access.kind === "unauthenticated") return { ok: false, status: 401 };
  if (access.kind === "not_admin") return { ok: false, status: 403 };
  if (access.kind !== "admin") return { ok: false, status: 503 };

  try {
    const supabase = await createServiceSupabaseClient();
    const { data: designFile, error: fileError } = await supabase
      .from("uploaded_design_files")
      .select("storage_bucket,storage_path")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError) return { ok: false, status: 503 };
    if (!designFile || designFile.storage_bucket !== DESIGN_BUCKET) return { ok: false, status: 404 };

    const { data, error } = await supabase.storage
      .from(DESIGN_BUCKET)
      .createSignedUrl(designFile.storage_path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) return { ok: false, status: 503 };
    return { ok: true, url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS };
  } catch {
    return { ok: false, status: 503 };
  }
}
