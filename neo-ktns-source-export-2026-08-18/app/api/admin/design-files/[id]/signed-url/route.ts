import { NextResponse } from "next/server";
import { createAdminDesignFileSignedUrl } from "@/lib/storage/admin-design-files";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  const result = await createAdminDesignFileSignedUrl(id);
  if (!result.ok) {
    const messages = {
      401: "Sesi admin diperlukan.",
      403: "Akses admin ditolak.",
      404: "File tidak ditemukan.",
      503: "Tautan file belum dapat disiapkan.",
    } as const;
    return NextResponse.json({ error: messages[result.status] }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { url: result.url, expiresIn: result.expiresIn },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// GET is provided for a direct download-link request from future admin pages;
// both methods execute the same server-side authentication and authorization.
export const GET = POST;
