import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  ALLOWED_DESIGN_EXTENSIONS,
  MAX_DESIGN_FILE_SIZE,
  validateDesignFile,
} from "@/lib/storage/design-file-validation";

export const DESIGN_BUCKET = "design-files";
export { ALLOWED_DESIGN_EXTENSIONS, MAX_DESIGN_FILE_SIZE, validateDesignFile };

export function sanitizeDesignFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const baseName = filename.slice(0, -(extension.length + 1)).normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "desain";
  return `${baseName}.${extension}`;
}

export function buildDesignObjectPath(orderNumber: string, filename: string) {
  return `orders/${orderNumber}/${crypto.randomUUID()}-${sanitizeDesignFilename(filename)}`;
}

export async function uploadOrderDesignFile(orderNumber: string, file: File) {
  const validation = await validateDesignFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const supabase = await createServiceSupabaseClient();
  const originalFilename = sanitizeDesignFilename(file.name);
  const storagePath = buildDesignObjectPath(orderNumber, originalFilename);
  const { error } = await supabase.storage.from(DESIGN_BUCKET).upload(storagePath, await file.arrayBuffer(), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { storagePath, originalFilename, mimeType: file.type || null, sizeBytes: file.size };
}

export async function hashUploadToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
