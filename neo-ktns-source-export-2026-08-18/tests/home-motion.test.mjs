import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [homeMotion, styles, header, homePage] = await Promise.all([
  readFile(new URL("../components/motion/home-motion.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../components/site/header.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/(store)/page.tsx", import.meta.url), "utf8"),
]);

test("homepage motion uses a single shared IntersectionObserver", () => {
  assert.equal((homeMotion.match(/new IntersectionObserver/g) ?? []).length, 1);
  assert.match(homeMotion, /observer\.unobserve\(element\)/);
});

test("reveal visibility is progressive enhancement rather than server-hidden content", () => {
  assert.doesNotMatch(homePage, /motion-enhanced/);
  assert.match(styles, /\.motion-enhanced\[data-reveal\]/);
  assert.match(homeMotion, /classList\.add\(ENHANCED_CLASS\)/);
});

test("reduced-motion mode keeps enhanced content visible", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /opacity: 1 !important/);
  assert.match(styles, /translate: 0 0 !important/);
});

test("mobile navigation uses an opaque surface and scroll locking", () => {
  assert.match(header, /mobile-menu-panel/);
  assert.match(header, /bg-\[var\(--surface-raised\)\]/);
  assert.match(header, /document\.body\.style\.overflow = "hidden"/);
  assert.doesNotMatch(header, /mobile-menu-panel[^\n]*glass-surface/);
});
