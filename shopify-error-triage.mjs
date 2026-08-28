export const MAX_ERROR_LENGTH = 500;

const OFFICIAL_ERRORS_URL = "https://help.shopify.com/en/manual/products/import-export/common-import-issues";
const IMPORT_GUIDE_URL = "https://help.shopify.com/en/manual/products/import-export/import-products";
const REFERENCE_LIMIT_EXAMPLE_URL = "https://community.shopify.com/t/csv-import-issue/645056";

const scopeLabels = Object.freeze({
  "local-file": "Local file",
  "store-state": "Store state",
  "external-resource": "External resource",
});

const rules = [
  {
    id: "reference-limit",
    patterns: [/cannot add more than 10[,.]?000 references to a file/],
    title: "A referenced file reached Shopify's reference limit",
    cause: "The message points to a store file or asset reference limit, not the number of CSV rows.",
    nextStep: "Inspect the affected row's image or file-reference fields. If one asset is reused broadly, use a fresh asset URL or ask Shopify Support to confirm the store-side count before changing the catalog.",
    scope: "store-state",
    checkerFit: "A local CSV checker can show repeated URLs, but it cannot read the existing store-side reference count.",
    sourceUrl: REFERENCE_LIMIT_EXAMPLE_URL,
    sourceLabel: "Current Shopify Community example",
    confidence: "community-observed",
  },
  {
    id: "daily-variant-limit",
    patterns: [/daily variant creation limit reached/],
    title: "The store reached its daily variant-creation limit",
    cause: "Eligible high-variant stores can create only a bounded number of new variants in a 24-hour window.",
    nextStep: "Wait for the 24-hour window to reset, then retry a smaller import. Do not reshape otherwise valid rows solely to bypass the limit.",
    scope: "store-state",
    checkerFit: "The file may be structurally valid; a local checker cannot see the store's rolling variant count.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "fulfillment-service-blank",
    patterns: [/fulfillment service can(?:'|’)t be blank/],
    title: "Fulfillment service is blank",
    cause: "The affected row requires a fulfillment-service value.",
    nextStep: "Use the exact service handle configured for the variant, or use manual when no fulfillment service applies.",
    scope: "local-file",
    checkerFit: "The local Shopify profile can flag a blank or malformed fulfillment value when the relevant column is present.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "handle-exists",
    patterns: [/ignored line .* because handle .* already exists/],
    title: "The product handle already exists",
    cause: "Shopify uses the handle to identify a product, and this import is colliding with an existing handle.",
    nextStep: "Decide whether the row should update the existing product or create a new product. Use overwrite only after backing up and reviewing every included column.",
    scope: "store-state",
    checkerFit: "A local file can reveal duplicate handles inside the file, but it cannot know which handles already exist in the store.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "missing-product-data",
    patterns: [/ignored line .* because it did not contain product data/],
    title: "A row has a handle but no product title",
    cause: "Shopify found a product identifier without the product data required for that row.",
    nextStep: "Review the affected row and its neighboring rows. Restore the intended title or remove the accidental handle without guessing other product values.",
    scope: "local-file",
    checkerFit: "The local Shopify profile can help inspect required headers and values without uploading the catalog.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "illegal-quoting",
    patterns: [/illegal quoting(?: on line)?|missing or stray quote(?: on line)?/],
    title: "The CSV has invalid quoting or encoding",
    cause: "A missing, extra, or smart quote can change where Shopify thinks a field or row ends; non-UTF-8 text can produce the same family of error.",
    nextStep: "Save the source as UTF-8, replace smart quotes used as delimiters with straight quotes, and inspect the reported line in a text editor before importing again.",
    scope: "local-file",
    checkerFit: "The local checker rejects invalid UTF-8 and reports unclosed quoted fields, while preserving every parsed row for review.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "incorrect-header-check",
    patterns: [/incorrect header check/],
    title: "Shopify associated the header check with an image row",
    cause: "Shopify's current troubleshooting page directs merchants to isolate the image on the affected line.",
    nextStep: "Temporarily remove the image from that line and retry a small test. If the import then works, host the image at a different public direct URL.",
    scope: "external-resource",
    checkerFit: "The local checker validates URL shape only; it deliberately does not fetch or inspect remote images.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "invalid-header",
    patterns: [/invalid csv header|missing headers|unexpected token\s*</, /json at position 0|choose column headings/],
    match: "any",
    title: "The CSV headers do not match Shopify's expected template",
    cause: "Shopify treats product CSV header names as case-sensitive and may reject missing, renamed, or whitespace-padded headers.",
    nextStep: "Compare the first row with a fresh Shopify sample export for the same workflow. Correct only the headers you can map with certainty.",
    scope: "local-file",
    checkerFit: "The local Shopify profile reports bounded required-header and header-case issues.",
    sourceUrl: IMPORT_GUIDE_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "inventory-policy",
    patterns: [/inventory policy .*not included in the list/],
    title: "Inventory policy has an unsupported value",
    cause: "Shopify accepts deny or continue for the inventory policy field.",
    nextStep: "Change only the affected policy cell to deny or continue, according to the intended out-of-stock behavior.",
    scope: "local-file",
    checkerFit: "The local Shopify profile checks the documented deny/continue values.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "inventory-quantity-blank",
    patterns: [/inventory quantity can(?:'|’)t be blank/],
    title: "Tracked inventory has no quantity",
    cause: "When inventory tracking is enabled, Shopify requires an inventory quantity.",
    nextStep: "Enter the intended whole-number quantity. If the item should not be tracked, leave the inventory tracker blank instead of inventing a quantity.",
    scope: "local-file",
    checkerFit: "The checker validates present numeric quantities but does not infer whether a blank business value should be zero or untracked.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "inventory-quantity-number",
    patterns: [/inventory quantity is not a number/],
    title: "Inventory quantity is not numeric",
    cause: "The quantity field contains something other than a whole number.",
    nextStep: "Remove units, currency symbols, and decimal formatting from the affected quantity cell, then confirm the intended stock count.",
    scope: "local-file",
    checkerFit: "The local Shopify profile flags non-integer inventory quantities.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "product-category",
    patterns: [/not a valid product category/],
    title: "Product category is not an exact taxonomy value",
    cause: "The category must match Shopify's standard taxonomy breadcrumb or category ID exactly.",
    nextStep: "Look up the intended category in Shopify's current taxonomy and replace the affected cell with the exact breadcrumb or ID.",
    scope: "external-resource",
    checkerFit: "The local checker does not bundle or fetch Shopify's changing product taxonomy.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "image-download",
    patterns: [/error occurred while trying to download the image|image file is missing/],
    match: "any",
    title: "Shopify could not download the image",
    cause: "The image is missing or unavailable to Shopify's importer.",
    nextStep: "Open the exact URL without signing in, confirm it returns the image directly, and replace it with a stable public URL if it fails.",
    scope: "external-resource",
    checkerFit: "The checker validates URL shape only and makes no network request to the image host.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "image-dns",
    patterns: [/getaddrinfo.*nodename nor servname provided|nodename nor servname provided.*not known/],
    match: "any",
    title: "The image host name could not be resolved",
    cause: "The image URL is malformed or its host is not publicly resolvable.",
    nextStep: "Correct the full public image URL and verify that it opens directly outside the store admin before importing again.",
    scope: "external-resource",
    checkerFit: "The local checker can reject malformed URLs but deliberately does not perform DNS or image-host checks.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "duplicate-options",
    patterns: [/options are not unique/],
    title: "Two variants resolve to the same option values",
    cause: "Shopify found duplicate option combinations, or the same product handle appears in another conflicting row.",
    nextStep: "Group rows by handle and compare every option value. Keep one row per intended variant combination; do not auto-delete a duplicate until you identify which row is authoritative.",
    scope: "local-file",
    checkerFit: "The generic checker reports exact duplicate rows, but it does not yet prove semantic uniqueness across Shopify option columns.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "price-blank",
    patterns: [/price can(?:'|’)t be blank/],
    title: "A required price is blank",
    cause: "Shopify requires a price on the affected variant row.",
    nextStep: "Enter the intended numeric price without a currency symbol. Do not substitute zero unless the product is genuinely meant to be free.",
    scope: "local-file",
    checkerFit: "The local profile checks numeric price format when present but does not invent missing business values.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "image-megapixels",
    patterns: [/uploaded image exceeds the .*megapixel limit/],
    title: "The image exceeds Shopify's accepted dimensions",
    cause: "The remote image is larger than the importer accepts.",
    nextStep: "Resize the source image within Shopify's current documented limits, publish the resized asset at a direct URL, and update only the affected image cell.",
    scope: "external-resource",
    checkerFit: "The checker does not download images or inspect their dimensions.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "product-reference",
    patterns: [/value must be a valid product reference/],
    title: "A metafield references a product that does not exist yet",
    cause: "Shopify can resolve the product reference only after the target product exists in the store.",
    nextStep: "Import the products without those metafield references first. After the products exist, add the references and run a second overwrite import with a backup.",
    scope: "store-state",
    checkerFit: "A local checker cannot verify whether the referenced product already exists in the store.",
    sourceUrl: OFFICIAL_ERRORS_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
  {
    id: "line-invalid-no-details",
    patterns: [/line is invalid.*no details/],
    title: "Existing variant options conflict with the new option positions",
    cause: "Shopify documents this vague error for imports that move an existing option value into another option position and create a uniqueness conflict.",
    nextStep: "Use a temporary option name for the first import, verify the result on a small sample, then run a second import that applies the intended final name.",
    scope: "store-state",
    checkerFit: "The file alone does not contain enough store history to prove this conflict.",
    sourceUrl: IMPORT_GUIDE_URL,
    sourceLabel: "Shopify Help Center",
    confidence: "official-documented",
  },
];

function normalizeErrorText(value) {
  return value
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function matches(rule, normalized) {
  const results = rule.patterns.map((pattern) => pattern.test(normalized));
  return rule.match === "any" ? results.some(Boolean) : results.every(Boolean);
}

export function classifyShopifyError(errorText) {
  if (typeof errorText !== "string") throw new TypeError("Shopify error text must be a string");
  const trimmed = errorText.trim();
  if (!trimmed) return { status: "empty" };
  if (trimmed.length > MAX_ERROR_LENGTH) return { status: "too_long", maxLength: MAX_ERROR_LENGTH };

  const normalized = normalizeErrorText(trimmed);
  const rule = rules.find((candidate) => matches(candidate, normalized));
  if (!rule) {
    return {
      status: "unknown",
      title: "No documented match found",
      nextStep: "Check Shopify's current troubleshooting page or contact Shopify Support. Do not change catalog values based on a guessed cause.",
      sourceUrl: OFFICIAL_ERRORS_URL,
      sourceLabel: "Shopify Help Center",
    };
  }

  return {
    status: "matched",
    id: rule.id,
    title: rule.title,
    cause: rule.cause,
    nextStep: rule.nextStep,
    scope: rule.scope,
    scopeLabel: scopeLabels[rule.scope],
    checkerFit: rule.checkerFit,
    sourceUrl: rule.sourceUrl,
    sourceLabel: rule.sourceLabel,
    confidence: rule.confidence,
  };
}
