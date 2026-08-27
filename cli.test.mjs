import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, runCli } from "./cli.mjs";

const bytes = text => new TextEncoder().encode(text);

test("free CLI accepts one input and keeps all paths distinct", () => {
  const config = parseArgs(["input.csv"]);
  assert.match(config.output, /input\.normalized\.csv$/);
  assert.match(config.report, /input\.issues\.csv$/);
  assert.throws(() => parseArgs(["one.csv", "two.csv"]), /exactly one/);
  assert.throws(() => parseArgs(["input.csv", "--output", "input.csv"]), /must be different/);
});

test("free CLI writes a clean normalized file and report", () => {
  const writes = []; const out = []; const errors = [];
  const exit = runCli(["input.csv", "--output", "clean.csv", "--report", "report.csv"], {
    readFile: () => bytes("name,price\nMug,12"), outputExists: () => false,
    writeFile: (file, data) => writes.push({ file, data }), stdout: message => out.push(message), stderr: message => errors.push(message),
  });
  assert.equal(exit, 0); assert.equal(writes.length, 2); assert.equal(errors.length, 0);
  assert.match(new TextDecoder().decode(writes[0].data), /name,price\r\nMug,12/);
  assert.match(new TextDecoder().decode(writes[1].data), /type,row,detail/);
});

test("free CLI reports warnings and withholds rejected output", () => {
  const warningWrites = [];
  const common = { outputExists: () => false, stdout: () => {}, stderr: () => {} };
  assert.equal(runCli(["input.csv"], { ...common, readFile: () => bytes("name,name\nMug,Mug"), writeFile: (file, data) => warningWrites.push({ file, data }) }), 1);
  assert.equal(warningWrites.length, 2);
  const rejectedWrites = [];
  assert.equal(runCli(["input.csv"], { ...common, readFile: () => Uint8Array.from([0xff, 0xfe, 65, 0]), writeFile: (file, data) => rejectedWrites.push({ file, data }) }), 1);
  assert.equal(rejectedWrites.length, 1); assert.match(rejectedWrites[0].file, /issues\.csv$/);
});

test("free CLI refuses existing outputs and bad invocations", () => {
  const quiet = { readFile: () => bytes("a\n1"), writeFile: () => {}, stdout: () => {}, stderr: () => {} };
  assert.equal(runCli(["input.csv"], { ...quiet, outputExists: () => true }), 2);
  assert.equal(runCli([], { ...quiet, outputExists: () => false }), 2);
});
