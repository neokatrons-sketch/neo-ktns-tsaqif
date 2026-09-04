import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { hashSecret, verifyUploadToken } from "@/lib/checkout/server";
import { logUnexpectedServerFailure } from "@/lib/server-log";
import { DESIGN_BUCKET, MAX_DESIGN_FILE_SIZE, uploadOrderDesignFile, validateDesignFile } from "@/lib/storage/design-files";

const MAX_UPLOAD_REQUEST_SIZE = MAX_DESIGN_FILE_SIZE + 512 * 1024;

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_REQUEST_SIZE) {
      return NextResponse.json({ error: "Ukuran file melebihi 10 MB." }, { status: 413 });
    }
    const form = await request.formData();
    const orderId = String(form.get("orderId") ?? "");
    const uploadToken = String(form.get("uploadToken") ?? "");
    const file = form.get("file");
    if (!orderId || !uploadToken || !(file instanceof File)) return NextResponse.json({ error: "Data upload tidak lengkap." }, { status: 400 });
    const validation = await validateDesignFile(file);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const supabase = await createServiceSupabaseClient();
    // The browser sends the raw signed token once.  It is hashed once here to
    // compare with the single SHA-256 value persisted during draft creation.
    const uploadTokenHash = await hashSecret(uploadToken);
    const { data: order } = await supabase.from("orders").select("id,order_number,status,upload_token_hash").eq("id", orderId).maybeSingle();
    if (!order || order.status !== "Draft" || order.upload_token_hash !== uploadTokenHash || !await verifyUploadToken(uploadToken, orderId)) {
      return NextResponse.json({ error: "Sesi upload sudah berakhir. Kembali ke checkout dan coba lagi." }, { status: 403 });
    }
    const { data: existingFile, error: existingFileError } = await supabase.from("uploaded_design_files").select("id,original_filename").eq("order_id", orderId).limit(1).maybeSingle();
    if (existingFileError) throw existingFileError;
    if (existingFile) {
      const { error: consumeError } = await supabase.from("orders").update({ upload_token_hash: null }).eq("id", orderId).eq("upload_token_hash", uploadTokenHash);
      if (consumeError) throw consumeError;
      return NextResponse.json({ file: existingFile, recovered: true });
    }

    const uploaded = await uploadOrderDesignFile(order.order_number, file);
    const { data, error } = await supabase.from("uploaded_design_files").insert({
      // One order accepts one checkout design. Reusing the order UUID as the
      // metadata UUID makes concurrent uploads conflict safely without a new
      // schema object; the losing private object is removed below.
      id: orderId,
      order_id: orderId,
      original_filename: uploaded.originalFilename,
      storage_bucket: DESIGN_BUCKET,
      storage_path: uploaded.storagePath,
      mime_type: uploaded.mimeType,
      size_bytes: uploaded.sizeBytes,
    }).select("id,original_filename").single();
    if (error) {
      // The database metadata is authoritative. Do not leave a private orphan
      // object behind when its metadata cannot be recorded.
      await supabase.storage.from(DESIGN_BUCKET).remove([uploaded.storagePath]);
      const { data: concurrentFile } = await supabase.from("uploaded_design_files").select("id,original_filename").eq("order_id", orderId).limit(1).maybeSingle();
      if (concurrentFile) {
        const { error: consumeError } = await supabase.from("orders").update({ upload_token_hash: null }).eq("id", orderId).eq("upload_token_hash", uploadTokenHash);
        if (consumeError) throw consumeError;
        return NextResponse.json({ file: concurrentFile, recovered: true });
      }
      throw error;
    }
    const { error: consumeError } = await supabase.from("orders").update({ upload_token_hash: null }).eq("id", orderId).eq("upload_token_hash", uploadTokenHash);
    if (consumeError) throw consumeError;
    return NextResponse.json({ file: data }, { status: 201 });
  } catch (error) {
    logUnexpectedServerFailure("design-files/upload", error);
    const message = error instanceof Error && /Format file|Ukuran file|File desain|Isi file|SVG aktif/.test(error.message)
      ? error.message
      : "File desain belum dapat diunggah. Silakan coba lagi.";
    return NextResponse.json({ error: message }, { status: message === "File desain belum dapat diunggah. Silakan coba lagi." ? 500 : 400 });
  }
}
