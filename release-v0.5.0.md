This release adds a free composite GitHub Action for checking one generic UTF-8 CSV up to 10 MiB without uploading it.

```yaml
- uses: softpeanut/csv-preflight@v0.5.0
  with:
    path: data/import.csv
```

The Action writes its default normalized CSV and issue report under the runner temporary directory and preserves the CLI contract: clean input exits 0; detected issues or rejected input exits 1; invocation/runtime errors exit 2. Pin to the full release commit SHA when immutable third-party code is required:

```yaml
- uses: softpeanut/csv-preflight@340b31bb16a4c39463be3378270ea6c628aa5461
```

The [complete workflow guide](https://softpeanut.github.io/csv-preflight/validate-csv-github-actions.html) shows path-scoped triggers, read-only permissions, and how to retain diagnostic artifacts after a failed check.

The browser checker, CLI, and Action are free. The separate completed Pro batch edition remains optional under the [published product terms](https://softpeanut.github.io/csv-preflight/pro-terms.html). A separate [$99 fixed-scope setup](https://softpeanut.github.io/csv-preflight/ci-setup-terms.html) is available for one public or sanitized repository; its scope, exclusions, payment, cancellation, and refund rules are published before any fit check or payment.
