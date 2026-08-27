import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { parseCsv } from "./csv.mjs";

const DATA_ROWS = 100_000;
const RUNS = 11;
const WARMUPS = 3;

function buildSimpleCsv() {
  const rows = ["id,name,city"];
  for (let index = 1; index <= DATA_ROWS; index += 1) {
    rows.push(`${index},person-${index},city-${index % 100}`);
  }
  return rows.join("\n");
}

function splitCsv(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => line.split(","));
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

function measure(operation) {
  for (let index = 0; index < WARMUPS; index += 1) operation();
  const samples = [];
  for (let index = 0; index < RUNS; index += 1) {
    const startedAt = performance.now();
    const rows = operation();
    samples.push(performance.now() - startedAt);
    assert.equal(rows.length, DATA_ROWS + 1);
  }
  const medianMs = median(samples);
  return {
    median_ms: Number(medianMs.toFixed(2)),
    rows_per_second: Math.round((DATA_ROWS + 1) / (medianMs / 1000)),
    runs: RUNS,
  };
}

const csv = buildSimpleCsv();
const parsed = parseCsv(csv).rows;
const split = splitCsv(csv);
assert.deepEqual(parsed, split);

const counterexample = 'id,note\n1,"comma, inside"\n2,"line one\nline two"';
const expectedCounterexample = [["id", "note"], ["1", "comma, inside"], ["2", "line one\nline two"]];
assert.deepEqual(parseCsv(counterexample).rows, expectedCounterexample);
assert.notDeepEqual(splitCsv(counterexample), expectedCounterexample);

const stateMachine = measure(() => parseCsv(csv).rows);
const lineSplit = measure(() => splitCsv(csv));
const result = {
  recorded_at: new Date().toISOString(),
  runtime: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    cpu: os.cpus()[0]?.model ?? "unknown",
  },
  dataset: {
    data_rows: DATA_ROWS,
    total_rows: DATA_ROWS + 1,
    utf8_bytes: Buffer.byteLength(csv),
    shape: "three unquoted fields per row",
  },
  measurements: {
    state_machine: stateMachine,
    naive_line_split: lineSplit,
    state_machine_overhead_ratio: Number((stateMachine.median_ms / lineSplit.median_ms).toFixed(2)),
  },
  correctness: {
    outputs_match_on_simple_dataset: true,
    state_machine_preserves_quoted_counterexample: true,
    naive_line_split_preserves_quoted_counterexample: false,
  },
  method: `${WARMUPS} warmups followed by ${RUNS} measured in-process runs; median wall-clock time`,
};

const json = `${JSON.stringify(result, null, 2)}\n`;
if (process.argv.includes("--write")) {
  await writeFile(new URL("benchmark-results.json", import.meta.url), json);
}
process.stdout.write(json);
