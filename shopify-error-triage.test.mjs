import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyShopifyError, MAX_ERROR_LENGTH } from "./shopify-error-triage.mjs";

const samples = new Map([
  ["Daily variant creation limit reached, try again", "daily-variant-limit"],
  ["Line 2: Validation failed: Cannot add more than 10000 references to a file.", "reference-limit"],
  ["Fulfillment service can't be blank", "fulfillment-service-blank"],
  ["Ignored line 4-8 because handle `shirt` already exists", "handle-exists"],
  ["Ignored line 9 because it did not contain product data", "missing-product-data"],
  ["Illegal quoting on line 17", "illegal-quoting"],
  ["Incorrect header check", "incorrect-header-check"],
  ["Invalid CSV header: missing headers", "invalid-header"],
  ["Network error: Unexpected token < in JSON at position 0", "invalid-header"],
  ["Inventory policy is not included in the list", "inventory-policy"],
  ["Inventory quantity can't be blank", "inventory-quantity-blank"],
  ["Inventory quantity is not a number", "inventory-quantity-number"],
  ["Missing or stray quote on line 2", "illegal-quoting"],
  ["Not a valid product category", "product-category"],
  ["Validation failed: An error occurred while trying to download the image", "image-download"],
  ["Validation failed: getaddrinfo: nodename nor servname provided, or not known", "image-dns"],
  ["Validation failed: options are not unique", "duplicate-options"],
  ["Validation failed: price can't be blank", "price-blank"],
  ["Validation failed: The uploaded image exceeds the 20 megapixel limit", "image-megapixels"],
  ["Validation failed: Value must be a valid product reference", "product-reference"],
  ['Import fails with error “Line is invalid (No details)”', "line-invalid-no-details"],
]);

test("classifies the documented error families without store or file access", () => {
  for (const [message, expectedId] of samples) {
    const result = classifyShopifyError(message);
    assert.equal(result.status, "matched", message);
    assert.equal(result.id, expectedId, message);
    assert.ok(["local-file", "store-state", "external-resource"].includes(result.scope));
    assert.match(result.sourceUrl, /^https:\/\//);
  }
});

test("normalizes case, whitespace, smart quotes, and variable line numbers", () => {
  assert.equal(classifyShopifyError("  INVENTORY   QUANTITY IS NOT A NUMBER  ").id, "inventory-quantity-number");
  assert.equal(classifyShopifyError("Fulfillment service can’t be blank").id, "fulfillment-service-blank");
  assert.equal(classifyShopifyError("Ignored line 2-999 because handle shirt already exists").id, "handle-exists");
});

test("returns bounded non-diagnoses for empty, long, and unknown input", () => {
  assert.deepEqual(classifyShopifyError("  "), { status: "empty" });
  assert.deepEqual(classifyShopifyError("x".repeat(MAX_ERROR_LENGTH + 1)), { status: "too_long", maxLength: MAX_ERROR_LENGTH });
  const unknown = classifyShopifyError("A brand-new importer message with no documented match");
  assert.equal(unknown.status, "unknown");
  assert.doesNotMatch(JSON.stringify(unknown), /brand-new importer message/);
  assert.throws(() => classifyShopifyError(null), TypeError);
});

test("publishes a local-only bounded triage page with no data intake or network code", () => {
  const page = readFileSync(new URL("./shopify-csv-error-triage.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("./shopify-error-triage-app.mjs", import.meta.url), "utf8");
  assert.match(page, /maxlength="500"/);
  assert.match(page, /Nothing is uploaded, stored, or sent/);
  assert.match(page, /Do not paste CSV rows, product or customer data/);
  assert.match(page, /does not access a store, fetch images/);
  assert.match(page, /does not .*guarantee an import/);
  assert.match(page, /Unknown messages stay unknown/);
  assert.match(page, /10,000-reference message comes from a .*current Shopify Community report/);
  assert.match(page, /community-observed rather than official documentation/);
  assert.match(page, /template=csv-cleanup\.yml/);
  assert.doesNotMatch(page, /<form[^>]+\saction=|checkout|guarantees? (?:a successful )?import/i);
  assert.doesNotMatch(`${page}\n${app}`, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|WebSocket/);
  assert.doesNotMatch(app, /innerHTML|insertAdjacentHTML/);
});

test("renders a matched result through the browser entry point", async () => {
  class FakeNode {
    constructor() {
      this.hidden = false;
      this.textContent = "";
      this.value = "";
      this.href = "";
      this.listeners = new Map();
    }
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    removeAttribute(name) { if (name === "href") this.href = ""; }
  }

  const ids = [
    "triage-form", "error-text", "triage-result", "result-status", "result-title",
    "result-cause", "result-next", "result-scope", "result-source",
  ];
  const nodes = new Map(ids.map((id) => [id, new FakeNode()]));
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: (id) => nodes.get(id) ?? null };
  try {
    await import(`./shopify-error-triage-app.mjs?test=${Date.now()}`);
    nodes.get("error-text").value = "Validation failed: options are not unique";
    let prevented = false;
    nodes.get("triage-form").listeners.get("submit")({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(nodes.get("triage-result").hidden, false);
    assert.equal(nodes.get("result-status").textContent, "DOCUMENTED MATCH");
    assert.match(nodes.get("result-title").textContent, /option values/i);
    assert.match(nodes.get("result-source").href, /^https:\/\/help\.shopify\.com/);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
