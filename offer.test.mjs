import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const template = readFileSync(
  new URL("./.github/ISSUE_TEMPLATE/csv-cleanup.yml", import.meta.url),
  "utf8",
);
const koreanPage = readFileSync(new URL("./ko.html", import.meta.url), "utf8");
const koreanTemplate = readFileSync(
  new URL("./.github/ISSUE_TEMPLATE/csv-cleanup-ko.yml", import.meta.url),
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

test("Korean offer is bounded and uses the same safe intake", () => {
  assert.match(koreanPage, /149,000원/);
  assert.match(koreanPage, /CSV 파일 1개/);
  assert.match(koreanPage, /최대 10MB/);
  assert.match(koreanPage, /데이터, 개인정보, 인증정보 또는 비공개 링크를 올리지 마세요/);
  assert.match(koreanPage, /issues\/new\?template=csv-cleanup-ko\.yml/);
  assert.doesNotMatch(koreanPage, /바로 결제|즉시 예약|구매 완료/);
  assert.match(koreanTemplate, /이 문의는 예약이나 결제가 아닙니다/);
  assert.match(koreanTemplate, /민감정보나 규제 대상 데이터가 없습니다/);
  assert.match(koreanTemplate, /작업 전에 범위, 납기, 결제 및 취소 조건/);
});
