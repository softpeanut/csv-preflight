# CSV Preflight

CSV Preflight is a free, working browser tool for checking a CSV before importing it into another product. It accepts drag-and-drop, file selection, or pasted text; guesses comma/tab/semicolon/pipe delimiters; surfaces UTF-8 BOM and common encoding failures; reports empty or duplicate headers, inconsistent column counts, and duplicate rows; and downloads a normalized CSV plus a machine-readable error report.

All processing and downloads happen locally. There is no server, API, CDN, storage, analytics, cookie, external font, or network request in the app. UTF-16 and invalid UTF-8 files are rejected instead of silently corrupting them; export those files as UTF-8 first.

## Run and test

```sh
python3 -m http.server 8080
npm test
npm run benchmark
```

Open `http://localhost:8080/experiments/csv-preflight/` when serving from the repository root, or `http://localhost:8080/` when serving this directory. Automated tests cover CSV quoting, delimiter detection, issue detection, normalization, serialization, and encoding signatures. File drag/drop and browser download behavior still require a browser smoke test.

`npm run benchmark` regenerates a deterministic 100,001-row simple CSV in memory, verifies the
state-machine parser and a naive splitter agree on that input, proves the naive splitter fails a
quoted counterexample, and reports median timing over eleven runs. `benchmark-results.json` is one
recorded machine-specific run, not a universal performance claim.

## Normalization contract

- Whitespace-only headers become `column_N`.
- Repeated headers gain `_2`, `_3`, and so on.
- Exact duplicate data rows are reported but preserved.
- Short and long rows are reported but preserved without padding or truncation.
- Output retains the detected delimiter and adds a UTF-8 BOM for spreadsheet compatibility.

The report preserves every detected issue. Generic mode is structural preflight, not schema,
business-rule, or security validation.

## Shopify product CSV preset

The optional Shopify preset adds a bounded set of checks from Shopify's official product CSV
guide, reviewed on 2026-08-27:

- comma-separated columns and case-sensitive required headers;
- `Title` for new product imports, plus `URL handle` for product updates and new variants;
- `Option1 name` and `Option1 value` when an update includes `SKU` or `Weight value (grams)`;
- documented handle, status, boolean, inventory-policy/tracker, fulfillment-service, weight-unit,
  numeric price/cost/inventory/image-position, HTTPS image URL, tag/collection/text-length, custom
  fulfillment SKU dependency, and 250-images-per-product constraints.

Official sources:

- <https://help.shopify.com/en/manual/products/import-export/using-csv>
- <https://help.shopify.com/en/manual/products/import-export/import-products/>

The preset does not fetch image URLs, inspect a store, validate dynamic Markets/metafield columns,
cover every column dependency, or guarantee that Shopify accepts a file. Shopify supports older
headers and dynamic columns, so the tool avoids pretending it can reject every unknown header.

## Fixed-scope cleanup pilot

The checker remains free. A **$29 structural cleanup** covers one CSV up to 1 MB, a normalized CSV,
and a machine-readable issue report; it excludes schema mapping and revisions. A separate **$99
importer-fit cleanup** covers one CSV up to 10 MB, one target schema—including one bounded Shopify
product-import target—a cleaned CSV, a machine-readable issue report, and one revision. Both tiers
exclude OCR, database access, sensitive or regulated data, legal or business-rule validation, and
ongoing pipelines.

The public issue is only a fit check. Visitors are explicitly told not to post data, credentials, or private links. Scope, delivery timing, a safe private transfer method, payment method, and refund/cancellation terms must be agreed before work or payment. Submitting an issue is not a booking. Lightning payment is available only after that agreement: the seller quotes an exact sats amount and confirms `softpeanut@stacker.news` in writing. The public page tells visitors not to pay before receiving the quote.

No revenue should be claimed until a settled, withdrawable payment is verified.
