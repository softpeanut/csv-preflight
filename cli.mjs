#!/usr/bin/env node
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { analyze, detectEncoding, serializeCsv } from "./csv.mjs";

function defaultPaths(input) {
  const absolute = resolve(input);
  const stem = basename(absolute, extname(absolute)) || "csv-preflight";
  return { output: join(dirname(absolute), `${stem}.normalized.csv`), report: join(dirname(absolute), `${stem}.issues.csv`) };
}

export function parseArgs(argv) {
  const config = { input: "", output: "", report: "" };
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--output") {
      const next = argv[++index];
      if (!next || next.startsWith("-")) throw new Error("--output needs a path");
      config.output = next;
    } else if (value === "--report") {
      const next = argv[++index];
      if (!next || next.startsWith("-")) throw new Error("--report needs a path");
      config.report = next;
    }
    else if (value === "--help" || value === "-h") config.help = true;
    else if (value.startsWith("-")) throw new Error(`Unknown option: ${value}`);
    else if (config.input) throw new Error("The free CLI accepts exactly one input file");
    else config.input = value;
  }
  if (config.help) return config;
  if (!config.input) throw new Error("Choose one CSV input file");
  const defaults = defaultPaths(config.input);
  config.output = resolve(config.output || defaults.output);
  config.report = resolve(config.report || defaults.report);
  const input = resolve(config.input);
  if (new Set([input, config.output, config.report]).size !== 3) throw new Error("Input, normalized output, and report paths must be different");
  return config;
}

export function helpText() {
  return [
    "CSV Preflight free CLI (Node.js 20+)",
    "Usage: node cli.mjs input.csv [--output normalized.csv] [--report issues.csv]",
    "Exit 0: clean; exit 1: issues or rejected input; exit 2: invocation/runtime error.",
    "One generic UTF-8 file per run. Existing outputs are never overwritten.",
  ].join("\n");
}

function reportBytes(issues) {
  const rows = [["type", "row", "detail"], ...issues.map(issue => [issue.type, issue.row ?? "", issue.detail])];
  return new TextEncoder().encode(`\uFEFF${serializeCsv(rows)}`);
}

export function runCli(argv, io = {}) {
  const readFile = io.readFile || (file => new Uint8Array(readFileSync(file)));
  const outputExists = io.outputExists || existsSync;
  const writeFile = io.writeFile || ((file, bytes) => writeFileSync(file, bytes, { flag: "wx" }));
  const stdout = io.stdout || (message => process.stdout.write(`${message}\n`));
  const stderr = io.stderr || (message => process.stderr.write(`${message}\n`));
  try {
    const config = parseArgs(argv);
    if (config.help) { stdout(helpText()); return 0; }
    const bytes = readFile(config.input);
    if (!(bytes instanceof Uint8Array)) throw new TypeError("Input reader must return Uint8Array bytes");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("The free CLI input must be 10 MiB or less");
    const detected = detectEncoding(bytes);
    let issues; let normalized = null;
    if (!detected.supported) {
      issues = [{ type: "encoding", row: null, detail: `${detected.encoding} is not supported; export as UTF-8` }];
    } else {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(detected.offset));
      const result = analyze(text);
      issues = result.issues;
      if (!issues.some(issue => issue.type === "parse" || issue.type === "empty")) {
        normalized = new TextEncoder().encode(`\uFEFF${serializeCsv(result.cleanRows)}`);
      }
    }
    const targets = normalized ? [config.output, config.report] : [config.report];
    const occupied = targets.find(outputExists);
    if (occupied) throw new Error(`Refusing to overwrite existing output: ${occupied}`);
    if (normalized) writeFile(config.output, normalized);
    writeFile(config.report, reportBytes(issues));
    stdout(normalized ? `Normalized: ${config.output}` : "Normalized output withheld because the input was rejected");
    stdout(`Report: ${config.report} (${issues.length} issue(s))`);
    return issues.length ? 1 : 0;
  } catch (error) {
    stderr(`CSV Preflight: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
