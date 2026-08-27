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
const robots = readFileSync(new URL("./robots.txt", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("./sitemap.xml", import.meta.url), "utf8");
const caseStudy = readFileSync(new URL("./case-study.html", import.meta.url), "utf8");
const caseInput = readFileSync(new URL("./examples/messy-contacts.csv", import.meta.url), "utf8");
const caseOutput = readFileSync(new URL("./examples/normalized-contacts.csv", import.meta.url), "utf8");
const caseReport = readFileSync(new URL("./examples/preflight-errors.csv", import.meta.url), "utf8");
import { analyze, serializeCsv } from "./csv.mjs";

test("presents a bounded service without pretending payment or booking is live", () => {
  assert.match(page, /\$29 structural cleanup/);
  assert.match(page, /\$99 importer-fit cleanup/);
  assert.match(page, /No schema mapping or revision/);
  assert.match(page, /one file up to 10 MB/);
  assert.match(page, /bounded Shopify product import/);
  assert.match(page, /does not guarantee import success/);
  assert.match(page, /shopify:create/);
  assert.match(page, /shopify:update/);
  assert.match(page, /help\.shopify\.com\/en\/manual\/products\/import-export\/using-csv/);
  assert.match(page, /before any work or payment/);
  assert.match(page, /Payment available by Lightning/);
  assert.match(page, /softpeanut@stacker\.news/);
  assert.match(page, /Do not pay before receiving that written quote/);
  assert.match(page, /issues\/new\?template=csv-cleanup\.yml/);
  assert.doesNotMatch(page, /checkout|buy now|book now/i);
});

test("public intake blocks sensitive data and requires pre-work agreement", () => {
  assert.match(template, /not a booking or payment request/i);
  assert.match(template, /Do not upload your CSV, credentials, private links/i);
  assert.match(template, /contains no sensitive or regulated data/);
  assert.match(template, /before work starts/);
  assert.match(template, /\$29 structural cleanup/);
  assert.match(template, /\$99 importer-fit cleanup/);
});

test("Korean offer is bounded and uses the same safe intake", () => {
  assert.match(koreanPage, /39,000원/);
  assert.match(koreanPage, /149,000원/);
  assert.match(koreanPage, /CSV 파일 1개/);
  assert.match(koreanPage, /최대 10MB/);
  assert.match(koreanPage, /Shopify 상품 CSV 가져오기 포함 가능/);
  assert.match(koreanPage, /데이터, 개인정보, 인증정보 또는 비공개 링크를 올리지 마세요/);
  assert.match(koreanPage, /합의 후 Lightning 결제가 가능합니다/);
  assert.match(koreanPage, /안내 전에는 송금하지 마세요/);
  assert.match(koreanPage, /issues\/new\?template=csv-cleanup-ko\.yml/);
  assert.doesNotMatch(koreanPage, /바로 결제|즉시 예약|구매 완료/);
  assert.match(koreanTemplate, /이 문의는 예약이나 결제가 아닙니다/);
  assert.match(koreanTemplate, /민감정보나 규제 대상 데이터가 없습니다/);
  assert.match(koreanTemplate, /39,000원 구조 정리/);
  assert.match(koreanTemplate, /149,000원 가져오기 맞춤 정리/);
  assert.match(koreanTemplate, /작업 전에 범위, 납기, 결제 및 취소 조건/);
});

test("optional tips cannot be mistaken for service payment", () => {
  assert.match(page, /lightning:softpeanut@stacker\.news/);
  assert.match(page, /Tip 2\+ sats/);
  assert.match(page, /buys no cleanup, support, feature, or import guarantee/);
  assert.match(page, /separate from the fixed-scope service/);
  assert.match(koreanPage, /lightning:softpeanut@stacker\.news/);
  assert.match(koreanPage, /2 sats 이상 팁/);
  assert.match(koreanPage, /정리 작업·지원·기능·가져오기 성공을 구매하지 않습니다/);
  assert.match(koreanPage, /고정 범위 서비스와 별개입니다/);
});

test("publishes truthful search metadata for every public page", () => {
  const structuredDataMatch = page.match(
    /<script type="application\/ld\+json">([^<]+)<\/script>/,
  );
  assert.ok(structuredDataMatch);
  const structuredData = JSON.parse(structuredDataMatch[1]);
  assert.equal(structuredData["@type"], "SoftwareApplication");
  assert.equal(structuredData.isAccessibleForFree, true);
  assert.equal(structuredData.offers.price, "0");
  assert.match(robots, /Sitemap: https:\/\/softpeanut\.github\.io\/csv-preflight\/sitemap\.xml/);
  for (const location of [
    "https://softpeanut.github.io/csv-preflight/",
    "https://softpeanut.github.io/csv-preflight/ko.html",
    "https://softpeanut.github.io/csv-preflight/article.html",
    "https://softpeanut.github.io/csv-preflight/case-study.html",
  ]) {
    assert.match(sitemap, new RegExp(`<loc>${location.replaceAll(".", "\\.")}</loc>`));
  }
});

test("case study downloads are exact outputs of the public analyzer", () => {
  const analysis = analyze(caseInput);
  assert.equal(analysis.delimiter, ";");
  assert.equal(serializeCsv(analysis.cleanRows, analysis.delimiter).replaceAll("\r\n", "\n"), caseOutput);
  const report = serializeCsv([
    ["type", "row", "detail"],
    ...analysis.issues.map((issue) => [issue.type, issue.row ?? "", issue.detail]),
  ]).replaceAll("\r\n", "\n");
  assert.equal(report, caseReport);
  assert.match(caseStudy, /No row is silently deleted/);
  assert.match(caseStudy, /agreed before work starts/);
  assert.doesNotMatch(caseStudy, /customer|client result|guaranteed/i);
});
