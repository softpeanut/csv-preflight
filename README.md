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

### Free command-line check

Node.js 20 or newer can run the same generic structural preflight on one local file without a
browser. The repository copy works without an install:

```sh
node cli.mjs input.csv --output normalized.csv --report issues.csv
```

Version 0.6.0 prepares the same command for npm publication:

```sh
npx csv-preflight input.csv --output normalized.csv --report issues.csv
```

The free CLI returns exit 0 for a clean file, 1 for reported issues or rejected input, and 2 for an
invocation/runtime error. It accepts UTF-8 input up to 10 MiB and refuses to overwrite the input or
an existing output. It does not include the Pro archive's batch, Shopify-profile, ZIP, or JSON
automation features.

### Free GitHub Action

The same one-file check can fail a workflow when it finds structural issues. The Action passes
input paths through the environment rather than interpolating them into shell source, writes its
default artifacts under the runner's temporary directory, and keeps the CLI's exit-code contract:

```yaml
- uses: softpeanut/csv-preflight-action@v1
  with:
    path: data/import.csv
    normalized_path: ${{ runner.temp }}/import.normalized.csv
    report_path: ${{ runner.temp }}/import.issues.csv
```

Pin the Action to a full commit SHA when your workflow requires immutable third-party code. The
free Action checks one generic UTF-8 CSV up to 10 MiB; it does not upload the file or include the
Pro edition's batch, import-profile, ZIP, or JSON features.

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

The completed **CSV Preflight Pro offline batch edition** is offered as a 15,000 sat Personal
license for one user or a 100,000 sat Team license for up to 10 named users in one legal
organization. Both tiers receive the same completed archive; only the license scope differs. It processes 1–20 local UTF-8 CSV files per run, creates
comma-separated normalized files, per-file issue reports, and one manifest, and includes the
generic and bounded Shopify profiles. The same archive includes a Node.js 20+ CLI for local or CI
use with JSON output, deterministic exit codes, and existing-output protection. The licensed seller-held archive is complete and is not part
of this public free-tool repository. Buyers request an order without posting data, receive an
issue-bound single-use BOLT11 invoice matching the selected tier with a written 30-minute payment window, and
receive the archive through a buyer-only private GitHub repository after verified payment. The
seller verifies settlement through the invoice status endpoint; no public payment proof is needed.
Product terms and the separate service scope remain distinct.

The checker remains free. A **$29 structural cleanup** covers one CSV up to 1 MB, a normalized CSV,
and a machine-readable issue report; it excludes schema mapping and revisions. A separate **$99
importer-fit cleanup** covers one CSV up to 10 MB, one target schema—including one bounded Shopify
product-import target—a cleaned CSV, a machine-readable issue report, and one revision. Both tiers
exclude OCR, database access, sensitive or regulated data, legal or business-rule validation, and
ongoing pipelines.

The public issue is only a fit check. Visitors are explicitly told not to post data, credentials, or private links. Scope, delivery timing, a safe private transfer method, payment method, and refund/cancellation terms must be agreed before work or payment. Submitting an issue is not a booking. Lightning payment is available only after that agreement: the seller quotes an exact sats amount and confirms `softpeanut@stacker.news` in writing. The public page tells visitors not to pay before receiving the quote.

Free-tool users may separately send a voluntary 2+ sat Lightning tip. The pages state that a tip buys no cleanup, support, feature, or import guarantee and is not applied to the fixed-scope service.

No revenue should be claimed until a settled, withdrawable payment is verified.
