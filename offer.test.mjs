import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const template = readFileSync(
  new URL("./.github/ISSUE_TEMPLATE/csv-cleanup.yml", import.meta.url),
  "utf8",
);

test("presents a bounded service without pretending payment or booking is live", () => {
  assert.match(page, /\$99 pilot/);
  assert.match(page, /one file up to 10 MB/);
  assert.match(page, /before any work or payment/);
  assert.match(page, /issues\/new\?template=csv-cleanup\.yml/);
  assert.doesNotMatch(page, /checkout|buy now|book now/i);
});

test("public intake blocks sensitive data and requires pre-work agreement", () => {
  assert.match(template, /not a booking or payment request/i);
  assert.match(template, /Do not upload your CSV, credentials, private links/i);
  assert.match(template, /contains no sensitive or regulated data/);
  assert.match(template, /before work starts/);
});
