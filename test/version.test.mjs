import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the shared footer's version matches the newest CHANGELOG.md entry", () => {
  const top = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8").match(/^## (v[\d.]+)/m)[1];
  const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8").match(/footer\.js" data-version="(v[\d.]+)"/)[1];   // the shared footer's script line
  assert.equal(page, top);
});
