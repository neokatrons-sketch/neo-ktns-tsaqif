import assert from "node:assert/strict";
import test from "node:test";
import { inferEmbroiderySelection } from "../lib/catalog.ts";
import { getPublicLinePrice } from "../lib/public-pricing.ts";

const cases = [
  [["left-chest"], "one-point"],
  [["right-sleeve"], "one-point"],
  [["left-chest", "back"], "one-point-back"],
  [["left-chest", "right-sleeve"], "two-points"],
  [["left-chest", "right-sleeve", "back"], "two-points-back"],
  [["left-chest", "right-chest", "right-sleeve"], "three-points"],
  [["left-chest", "right-chest", "right-sleeve", "back"], "three-points-back"],
  [["left-chest", "right-chest", "left-sleeve", "right-sleeve"], "four-points"],
  [["left-chest", "right-chest", "left-sleeve", "right-sleeve", "back"], "five-points-full"],
  [["back"], "back-only"],
];

for (const [placements, packageCode] of cases) {
  test(`${placements.join(" + ")} maps to ${packageCode}`, () => {
    assert.equal(inferEmbroiderySelection(placements)?.packageCode, packageCode);
  });
}

test("invalid placement sets never infer a package", () => {
  const invalidSets = [
    ["left-chest", "right-chest"],
    ["left-sleeve", "right-sleeve"],
    ["left-chest", "left-sleeve"],
    ["right-chest", "right-sleeve", "back"],
    ["left-chest", "left-sleeve", "right-sleeve"],
  ];
  for (const placements of invalidSets) assert.equal(inferEmbroiderySelection(placements), null);
});

test("mapping is order independent", () => {
  const inferred = inferEmbroiderySelection(["back", "right-sleeve", "left-chest"]);
  assert.equal(inferred?.packageCode, "two-points-back");
  assert.equal(inferred?.presetId, "right-sleeve-left-chest-back");
});

test("size pricing resolves only through the supplied customer-safe server map", () => {
  const inferred = inferEmbroiderySelection(["left-chest"]);
  assert.ok(inferred);
  const prices = { "one-point:S": 129_900, "one-point:M": 139_900 };
  assert.deepEqual(getPublicLinePrice(prices, inferred.packageCode, "S", 2), { unit: 129_900, subtotal: 259_800 });
  assert.deepEqual(getPublicLinePrice(prices, inferred.packageCode, "M", 1), { unit: 139_900, subtotal: 139_900 });
  assert.equal(getPublicLinePrice(prices, inferred.packageCode, "XL", 1), null);
});
