export const MAX_DESIGN_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_DESIGN_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "svg", "psd", "eps", "cdr"] as const;

type DesignExtension = (typeof ALLOWED_DESIGN_EXTENSIONS)[number];

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function invalidContent() {
  return { valid: false, error: "Isi file tidak sesuai dengan format desain yang dipilih." } as const;
}

export async function validateDesignFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_DESIGN_EXTENSIONS.includes(extension as DesignExtension)) {
    return { valid: false, error: "Format file belum didukung." } as const;
  }
  if (file.size < 1) return { valid: false, error: "File desain tidak boleh kosong." } as const;
  if (file.size > MAX_DESIGN_FILE_SIZE) return { valid: false, error: "Ukuran file melebihi 10 MB." } as const;

  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 64 * 1024)).arrayBuffer());
  const executableMime = /(?:x-msdownload|x-dosexec|x-executable)/i.test(file.type);
  const executableSignature = startsWith(bytes, [0x4d, 0x5a])
    || startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46])
    || startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe])
    || startsWith(bytes, [0xca, 0xfe, 0xba, 0xbe])
    || startsWith(bytes, [0x23, 0x21]);
  if (executableMime || executableSignature) return invalidContent();

  if (extension === "png" && !startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return invalidContent();
  if ((extension === "jpg" || extension === "jpeg") && !startsWith(bytes, [0xff, 0xd8, 0xff])) return invalidContent();
  if (extension === "pdf" && !startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return invalidContent();
  if (extension === "psd" && !startsWith(bytes, [0x38, 0x42, 0x50, 0x53])) return invalidContent();
  if (extension === "eps" && !startsWith(bytes, [0x25, 0x21, 0x50, 0x53])) return invalidContent();

  if (extension === "svg") {
    const source = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trimStart();
    if (!/<svg(?:\s|>)/i.test(source)) return invalidContent();
    if (/<(?:script|iframe|object|embed|foreignObject)(?:\s|>)/i.test(source)
      || /\son[a-z]+\s*=/i.test(source)
      || /(?:href|src)\s*=\s*["']?\s*javascript:/i.test(source)) {
      return { valid: false, error: "SVG aktif tidak didukung. Hapus script atau konten tertanam terlebih dahulu." } as const;
    }
  }

  // CDR revisions and browser MIME reporting vary substantially. For CDR we
  // enforce extension, non-empty content, size, and executable denial without
  // requiring one version-specific magic value.
  return { valid: true, extension: extension as DesignExtension } as const;
}
