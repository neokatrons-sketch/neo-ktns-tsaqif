import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("security-test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };

function request(path, init) {
  return worker.fetch(new Request(`http://localhost${path}`, init), env, context);
}

test("anonymous admin page access is redirected to login", async () => {
  for (const path of ["/admin", "/admin/orders", "/admin/pricing", "/admin/statistics", "/admin/settings"]) {
    const response = await request(path);
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location")).pathname, "/admin/login");
  }
});

test("anonymous signed-file access is denied", async () => {
  const response = await request("/api/admin/design-files/00000000-0000-4000-8000-000000000000/signed-url");
  assert.ok([401, 403, 503].includes(response.status));
  assert.doesNotMatch(await response.text(), /service.role|supabase|postgres|storage_path/i);
});

test("malformed checkout requests return safe validation errors", async () => {
  const cases = [
    ["/api/checkout/create", "{}"],
    ["/api/checkout/finalize", JSON.stringify({ orderId: "bad", idempotencyKey: "bad" })],
    ["/api/checkout/promo", JSON.stringify({ items: [] })],
  ];
  for (const [path, body] of cases) {
    const response = await request(path, { method: "POST", headers: { "content-type": "application/json" }, body });
    assert.equal(response.status, 400);
    assert.doesNotMatch(await response.text(), /service.role|supabase|postgrest|postgres|constraint|stack/i);
  }
});

test("oversized checkout JSON is rejected before database access", async () => {
  const response = await request("/api/checkout/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: `{"padding":"${"x".repeat(129 * 1024)}"}`,
  });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /terlalu besar/i);
});
