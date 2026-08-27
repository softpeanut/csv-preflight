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

The report preserves every detected issue. This is structural preflight, not schema, business-rule, or security validation.

## Fixed-scope cleanup pilot

The checker remains free. A separate **$99 cleanup pilot** covers one CSV up to 10 MB, one target schema, a cleaned CSV, a machine-readable issue report, and one revision. It excludes OCR, database access, sensitive or regulated data, legal or business-rule validation, and ongoing pipelines.

The public issue is only a fit check. Visitors are explicitly told not to post data, credentials, or private links. Scope, delivery timing, a safe private transfer method, payment method, and refund/cancellation terms must be agreed before work or payment. Submitting an issue is not a booking.

No revenue should be claimed until a settled, withdrawable payment is verified.
