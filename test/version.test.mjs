import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the page's version matches the newest CHANGELOG.md entry", () => {
  const top = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8").match(/^## (v[\d.]+)/m)[1];
  const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8").match(/<div class="ver">(v[\d.]+)<\/div>/)[1];
  assert.equal(page, top);
});
