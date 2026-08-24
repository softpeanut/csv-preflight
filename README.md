# CSV Preflight

CSV Preflight is a free, working browser tool for checking a CSV before importing it into another product. It accepts drag-and-drop, file selection, or pasted text; guesses comma/tab/semicolon/pipe delimiters; surfaces UTF-8 BOM and common encoding failures; reports empty or duplicate headers, inconsistent column counts, and duplicate rows; and downloads a normalized CSV plus a machine-readable error report.

All processing and downloads happen locally. There is no server, API, CDN, storage, analytics, cookie, external font, or network request in the app. UTF-16 and invalid UTF-8 files are rejected instead of silently corrupting them; export those files as UTF-8 first.

## Run and test

```sh
python3 -m http.server 8080
npm test
```

Open `http://localhost:8080/experiments/csv-preflight/` when serving from the repository root, or `http://localhost:8080/` when serving this directory. Automated tests cover CSV quoting, delimiter detection, issue detection, normalization, serialization, and encoding signatures. File drag/drop and browser download behavior still require a browser smoke test.

## Normalization contract

- Whitespace-only headers become `column_N`.
- Repeated headers gain `_2`, `_3`, and so on.
- Exact duplicate data rows are removed after the first occurrence.
- Short rows are padded; extra cells are discarded to match the header width.
- Output retains the detected delimiter and adds a UTF-8 BOM for spreadsheet compatibility.

The report preserves every detected issue, including duplicate rows removed from cleaned output. This is structural preflight, not schema, business-rule, or security validation.

## Revenue hypothesis

The actual checker is free. A **planned $12 Pro idea** would add saved mapping recipes and batch checks. It is not for sale: the page has no checkout and collects no money. The only CTA opens a prefilled GitHub issue so a visitor can voluntarily register interest. Replace the placeholder repository URL with an owner-controlled repository before deployment.

No revenue should be claimed until a settled, withdrawable payment is verified. External publishing, account creation, payment setup, and outreach are outside this experiment.
