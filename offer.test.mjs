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
const csvCiCaseStudy = readFileSync(new URL("./csv-ci-case-study.html", import.meta.url), "utf8");
const caseInput = readFileSync(new URL("./examples/messy-contacts.csv", import.meta.url), "utf8");
const caseOutput = readFileSync(new URL("./examples/normalized-contacts.csv", import.meta.url), "utf8");
const caseReport = readFileSync(new URL("./examples/preflight-errors.csv", import.meta.url), "utf8");
const proTerms = readFileSync(new URL("./pro-terms.html", import.meta.url), "utf8");
const proTermsKo = readFileSync(new URL("./pro-terms-ko.html", import.meta.url), "utf8");
const batchTemplate = readFileSync(new URL("./.github/ISSUE_TEMPLATE/batch-license.yml", import.meta.url), "utf8");
const batchTemplateKo = readFileSync(new URL("./.github/ISSUE_TEMPLATE/batch-license-ko.yml", import.meta.url), "utf8");
const action = readFileSync(new URL("./action.yml", import.meta.url), "utf8");
const shopifyGuideKo = readFileSync(new URL("./shopify-csv-guide-ko.html", import.meta.url), "utf8");
const githubActionGuide = readFileSync(new URL("./validate-csv-github-actions.html", import.meta.url), "utf8");
const ciSetupTerms = readFileSync(new URL("./ci-setup-terms.html", import.meta.url), "utf8");
const ciSetupTermsZhCn = readFileSync(new URL("./ci-setup-terms-zh-CN.html", import.meta.url), "utf8");
const ciSetupTemplate = readFileSync(new URL("./.github/ISSUE_TEMPLATE/ci-setup.yml", import.meta.url), "utf8");
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

test("offers only the completed bounded offline batch product", () => {
  assert.match(page, /FREE NODE\.JS 20\+ CLI/);
  assert.match(page, /Download free CLI/);
  assert.match(page, /one generic file per run/);
  assert.match(koreanPage, /무료 NODE\.JS 20\+ CLI/);
  assert.match(page, /PERSONAL 15,000 \/ TEAM 100,000 SATS/);
  assert.match(page, /up to 10 named users in one legal organization/);
  assert.match(page, /up to 20 files locally/i);
  assert.match(page, /Node\.js 20\+ CLI/);
  assert.match(page, /JSON output, deterministic exit codes, and no-overwrite protection/);
  assert.match(page, /buyer-only private GitHub repository/);
  assert.match(page, /invoice matching the selected tier/);
  assert.match(page, /verifies its status directly/);
  assert.match(page, /template=batch-license\.yml/);
  assert.match(koreanPage, /개인 15,000 \/ 팀 100,000 SATS/);
  assert.match(koreanPage, /기명 사용자 최대 10명/);
  assert.match(koreanPage, /파일 최대 20개/);
  assert.match(koreanPage, /Node\.js 20\+ CLI/);
  assert.match(koreanPage, /선택한 등급에 맞는 이슈 전용 일회용 Lightning 인보이스/);
  assert.match(koreanPage, /template=batch-license-ko\.yml/);
  for (const terms of [proTerms, proTermsKo]) {
    assert.match(terms, /15,000/);
    assert.match(terms, /100,000/);
    assert.match(terms, /20/);
    assert.match(terms, /SHA-256/);
    assert.match(terms, /Lightning/);
    assert.match(terms, /CLI/);
  }
  assert.match(batchTemplate, /This public request is not payment/);
  assert.match(batchTemplate, /invoice matching the selected tier/);
  assert.match(batchTemplate, /Team — 100,000 sats — up to 10 named users/);
  assert.match(batchTemplate, /status endpoint lets the seller verify settlement/);
  assert.match(batchTemplate, /Do not post CSV content, filenames/);
  assert.match(batchTemplateKo, /이 공개 요청 자체는 결제가 아닙니다/);
  assert.match(batchTemplateKo, /선택한 등급에 맞는 이슈 전용 일회용 BOLT11 인보이스/);
  assert.match(batchTemplateKo, /팀 — 100,000 sats — 하나의 법인 조직 안에서 기명 사용자 최대 10명/);
  assert.match(batchTemplateKo, /CSV 내용, 파일명, 연락처/);
  assert.doesNotMatch(batchTemplate, /type: textarea/);
  assert.doesNotMatch(batchTemplateKo, /type: textarea/);
});

test("publishes the tested free Action without blurring the Pro boundary", () => {
  assert.match(page, /FREE GITHUB ACTION · v1\.0\.0/);
  assert.match(page, /softpeanut\/csv-preflight-action@v1/);
  assert.match(page, /keeps the file on the runner/);
  assert.match(page, /One generic UTF-8 CSV up to 10 MiB/);
  assert.match(page, /Batch, Shopify profiles, ZIP, and JSON output remain Pro features/);
  assert.match(action, /using: composite/);
  assert.match(action, /CSV_PREFLIGHT_INPUT: \$\{\{ inputs\.path \}\}/);
  assert.match(page, /validate-csv-github-actions\.html/);
  assert.match(githubActionGuide, /softpeanut\/csv-preflight-action@eb04c527a46ce3bc8bfc711fde8e93ca947597ae/);
  assert.match(githubActionGuide, /if: always\(\)/);
  assert.match(githubActionGuide, /contents: read/);
  assert.match(githubActionGuide, /does not upload the CSV/);
  assert.match(githubActionGuide, /one generic file up to 10 MiB per invocation/);
  assert.match(githubActionGuide, /separate Pro edition processes up to 20 files/);
  assert.doesNotMatch(githubActionGuide, /guarantees? import|official GitHub Action|Marketplace listing/i);
  assert.doesNotMatch(page, /Marketplace|official GitHub Action/i);
});

test("offers a bounded $99 one-repository CI setup without collecting secrets", () => {
  assert.match(page, /FIXED-SCOPE CSV CI SETUP · \$99/);
  assert.match(page, /one generic UTF-8 CSV path/);
  assert.match(page, /No private access, secrets, schema rules, import execution, or ongoing maintenance/);
  assert.match(page, /template=ci-setup\.yml/);
  assert.match(page, /ci-setup-terms\.html/);
  assert.match(ciSetupTerms, /fixed price is USD 99/);
  assert.match(ciSetupTerms, /one public repository or sanitized minimal reproduction/);
  assert.match(ciSetupTerms, /within three business days/);
  assert.match(ciSetupTerms, /single-use BOLT11 Lightning invoice/);
  assert.match(ciSetupTerms, /cancel before work begins/);
  assert.match(ciSetupTerms, /One in-scope revision requested within seven calendar days/);
  assert.match(ciSetupTerms, /requests no private repository access, credentials, or real CSV content/);
  assert.match(ciSetupTemplate, /not a booking or payment request/i);
  assert.match(ciSetupTemplate, /fixed price is \$99/);
  assert.match(ciSetupTemplate, /will not post data, credentials, private links/);
  assert.doesNotMatch(ciSetupTemplate, /type: textarea/);
  assert.doesNotMatch(page, /Buy now|Book now|instant setup/i);
});

test("publishes equivalent bounded Chinese terms for the catalog audience", () => {
  assert.match(ciSetupTermsZhCn, /固定价格为 USD 99/);
  assert.match(ciSetupTermsZhCn, /一个公开 GitHub 仓库或经过脱敏的最小复现/);
  assert.match(ciSetupTermsZhCn, /最大 10 MiB/);
  assert.match(ciSetupTermsZhCn, /三个工作日/);
  assert.match(ciSetupTermsZhCn, /一次性 BOLT11 Lightning invoice/);
  assert.match(ciSetupTermsZhCn, /工作开始前取消/);
  assert.match(ciSetupTermsZhCn, /七个自然日内提出的一次范围内修改/);
  assert.match(ciSetupTermsZhCn, /不会索取私有仓库访问权限、凭据或真实 CSV 内容/);
  assert.match(ciSetupTermsZhCn, /template=ci-setup\.yml/);
  assert.doesNotMatch(ciSetupTermsZhCn, /立即购买|立即预订|保证导入/);
});

test("publishes a bounded Korean Shopify CSV troubleshooting guide", () => {
  assert.match(koreanPage, /shopify-csv-guide-ko\.html/);
  assert.match(shopifyGuideKo, /UTF-8과 쉼표 구분/);
  assert.match(shopifyGuideKo, /Title/);
  assert.match(shopifyGuideKo, /URL handle/);
  assert.match(shopifyGuideKo, /Option1 name/);
  assert.match(shopifyGuideKo, /닫히지 않은 따옴표/);
  assert.match(shopifyGuideKo, /가져오기 성공 보장이 아니라/);
  assert.match(shopifyGuideKo, /help\.shopify\.com\/en\/manual\/products\/import-export\/common-import-issues/);
  assert.doesNotMatch(shopifyGuideKo, /공식 도구|Shopify 인증|모든 오류/);
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
    "https://softpeanut.github.io/csv-preflight/csv-ci-case-study.html",
    "https://softpeanut.github.io/csv-preflight/pro-terms.html",
    "https://softpeanut.github.io/csv-preflight/pro-terms-ko.html",
    "https://softpeanut.github.io/csv-preflight/shopify-csv-guide-ko.html",
    "https://softpeanut.github.io/csv-preflight/validate-csv-github-actions.html",
    "https://softpeanut.github.io/csv-preflight/ci-setup-terms.html",
    "https://softpeanut.github.io/csv-preflight/ci-setup-terms-zh-CN.html",
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

test("public CI case study preserves evidence and sales boundaries", () => {
  assert.match(page, /csv-ci-case-study\.html/);
  assert.match(githubActionGuide, /csv-ci-case-study\.html/);
  assert.match(csvCiCaseStudy, /1,583/);
  assert.match(csvCiCaseStudy, /<strong>10<\/strong>exact duplicates reported/);
  assert.match(csvCiCaseStudy, /1,573/);
  assert.match(csvCiCaseStudy, /CDFER\/jlcpcb-parts-database\/pull\/11/);
  assert.match(csvCiCaseStudy, /open contribution, not a customer result or an accepted upstream change/);
  assert.match(csvCiCaseStudy, /full multi-gigabyte generation process was not run locally/);
  assert.match(csvCiCaseStudy, /template=ci-setup\.yml/);
  assert.doesNotMatch(csvCiCaseStudy, /customer success|production-proven|guaranteed|adopted upstream/i);
});
