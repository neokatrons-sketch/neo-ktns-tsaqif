import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { MAX_DESIGN_FILE_SIZE, validateDesignFile } from "../lib/storage/design-file-validation.ts";

const samples = [
  ["design.png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["design.jpg", [0xff, 0xd8, 0xff, 0xdb]],
  ["design.jpeg", [0xff, 0xd8, 0xff, 0xe0]],
  ["design.pdf", Array.from(Buffer.from("%PDF-1.7"))],
  ["design.psd", Array.from(Buffer.from("8BPS"))],
  ["design.eps", Array.from(Buffer.from("%!PS-Adobe"))],
  ["design.cdr", Array.from(Buffer.from("RIFF0000CDR6"))],
];

for (const [name, bytes] of samples) {
  test(`accepts ${name}`, async () => {
    const result = await validateDesignFile(new File([Uint8Array.from(bytes)], name));
    assert.equal(result.valid, true);
  });
}

test("accepts inert SVG and rejects active SVG", async () => {
  assert.equal((await validateDesignFile(new File(["<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\"/></svg>"], "safe.svg"))).valid, true);
  assert.equal((await validateDesignFile(new File(["<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"], "active.svg"))).valid, false);
});

test("rejects an executable renamed as an image", async () => {
  const result = await validateDesignFile(new File([Uint8Array.from([0x4d, 0x5a, 0x90, 0x00])], "invoice.png", { type: "image/png" }));
  assert.equal(result.valid, false);
});

test("rejects unsupported, empty, and oversized files", async () => {
  assert.equal((await validateDesignFile(new File(["text"], "design.txt"))).valid, false);
  assert.equal((await validateDesignFile(new File([], "empty.pdf"))).valid, false);
  assert.equal((await validateDesignFile(new File([new Uint8Array(MAX_DESIGN_FILE_SIZE + 1)], "large.pdf"))).valid, false);
});
