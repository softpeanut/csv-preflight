export function detectEncoding(bytes) {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { encoding: "UTF-8 BOM", offset: 3, supported: true };
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { encoding: "UTF-16 LE", offset: 2, supported: false };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return { encoding: "UTF-16 BE", offset: 2, supported: false };
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { encoding: "UTF-8 (no BOM)", offset: 0, supported: true };
  } catch {
    return { encoding: "Unknown / not valid UTF-8", offset: 0, supported: false };
  }
}

export function guessDelimiter(text) {
  const candidates = [",", "\t", ";", "|"];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).slice(0, 20);
  let best = { delimiter: ",", score: -1 };
  for (const delimiter of candidates) {
    const widths = lines.map(line => parseCsv(line, delimiter).rows[0]?.length ?? 0);
    const common = widths.reduce((map, width) => map.set(width, (map.get(width) || 0) + 1), new Map());
    const [width, frequency] = [...common].sort((a, b) => b[1] - a[1])[0] || [1, 0];
    const score = width > 1 ? frequency * 100 + width : 0;
    if (score > best.score) best = { delimiter, score };
  }
  return best.delimiter;
}

export function parseCsv(text, delimiter = ",") {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (char !== "\r") field += char;
  }
  if (quoted) return { rows, error: "Unclosed quoted field" };
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return { rows, error: null };
}

export function analyze(text, delimiter = guessDelimiter(text)) {
  const parsed = parseCsv(text.replace(/^\uFEFF/, ""), delimiter);
  const issues = [];
  if (parsed.error) issues.push({ type: "parse", row: null, detail: parsed.error });
  if (!parsed.rows.length) return { delimiter, rows: [], cleanRows: [], issues: [{ type: "empty", row: null, detail: "No rows found" }] };
  const [headers, ...data] = parsed.rows;
  const seenHeaders = new Map();
  headers.forEach((header, index) => {
    const key = header.trim();
    if (!key) issues.push({ type: "empty_header", row: 1, detail: `Column ${index + 1} has an empty header` });
    if (key && seenHeaders.has(key)) issues.push({ type: "duplicate_header", row: 1, detail: `Header “${key}” is duplicated` });
    seenHeaders.set(key, index);
  });
  const seenRows = new Map();
  data.forEach((row, index) => {
    const number = index + 2;
    if (row.length !== headers.length) issues.push({ type: "column_count", row: number, detail: `Expected ${headers.length} columns, found ${row.length}` });
    const key = JSON.stringify(row);
    if (seenRows.has(key)) issues.push({ type: "duplicate_row", row: number, detail: `Duplicates row ${seenRows.get(key)}` });
    else seenRows.set(key, number);
  });
  const cleanHeaders = headers.map((value, index) => value.trim() || `column_${index + 1}`).map((value, index, all) => {
    const prior = all.slice(0, index).filter(item => item === value).length;
    return prior ? `${value}_${prior + 1}` : value;
  });
  // Preserve every data field exactly as parsed. Structural issues are evidence for the importer;
  // silently deleting duplicates, padding short rows, or truncating long rows can change meaning.
  const cleanRows = [cleanHeaders, ...data.map(row => [...row])];
  return { delimiter, rows: parsed.rows, cleanRows, issues };
}

export function serializeCsv(rows, delimiter = ",") {
  return rows.map(row => row.map(value => {
    const text = String(value ?? "");
    return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(delimiter)).join("\r\n") + "\r\n";
}

export function analyzeShopifyProduct(rows, delimiter, mode) {
  if (!['create', 'update'].includes(mode) || !rows.length) return [];
  const issues = [];
  const [headers, ...data] = rows;
  const exactIndex = name => headers.indexOf(name);
  const looseIndex = name => headers.findIndex(header => header.trim().toLowerCase() === name.toLowerCase());
  const requireHeader = (name, detail) => {
    if (exactIndex(name) >= 0) return true;
    const wrongCase = looseIndex(name);
    if (wrongCase >= 0) {
      issues.push({ type: 'shopify_header_case', row: 1, detail: `Use exact header “${name}”; found “${headers[wrongCase]}”` });
    } else {
      issues.push({ type: 'shopify_missing_header', row: 1, detail });
    }
    return false;
  };
  const valueAt = (row, name) => {
    const index = exactIndex(name);
    return index < 0 ? '' : String(row[index] ?? '').trim();
  };
  const validateValues = (name, predicate, detail) => {
    if (exactIndex(name) < 0) return;
    data.forEach((row, index) => {
      const value = valueAt(row, name);
      if (value && !predicate(value)) issues.push({ type: 'shopify_value', row: index + 2, detail: `${name}: ${detail}; found “${value}”` });
    });
  };

  if (delimiter !== ',') {
    issues.push({ type: 'shopify_delimiter', row: null, detail: 'Shopify product CSV columns must be separated by commas' });
  }
  const hasTitle = requireHeader('Title', `${mode === 'create' ? 'New product imports' : 'Product updates'} require the exact “Title” column`);
  const hasHandle = mode === 'update'
    ? requireHeader('URL handle', 'Product updates require the exact “URL handle” column')
    : exactIndex('URL handle') >= 0;

  const optionIndexes = ['Option1 name', 'Option1 value'].map(looseIndex);
  const hasVariantValues = optionIndexes.some(index => index >= 0 && data.some(row => String(row[index] ?? '').trim()));
  if (mode === 'create' && hasVariantValues && !hasHandle) {
    requireHeader('URL handle', 'New products with variants require the exact “URL handle” column');
  }
  if (mode === 'update' && ['SKU', 'Weight value (grams)'].some(name => exactIndex(name) >= 0)) {
    requireHeader('Option1 name', 'Variant-related updates require the exact “Option1 name” column');
    requireHeader('Option1 value', 'Variant-related updates require the exact “Option1 value” column');
  }

  if (mode === 'create' && hasTitle && !data.some(row => valueAt(row, 'Title'))) {
    issues.push({ type: 'shopify_required_value', row: null, detail: 'At least one new product row needs a Title value' });
  }
  if (mode === 'update' && hasHandle) {
    data.forEach((row, index) => {
      if (!valueAt(row, 'URL handle')) issues.push({ type: 'shopify_required_value', row: index + 2, detail: 'Product update rows need a URL handle value' });
    });
  }

  validateValues('URL handle', value => /^[A-Za-z0-9-]+$/.test(value), 'use only letters, numbers, and dashes with no spaces');
  validateValues('Status', value => ['active', 'draft', 'archived'].includes(value), 'use active, draft, or archived');
  validateValues('Published on online store', value => ['true', 'false'].includes(value), 'use true or false');
  validateValues('Charge tax', value => ['true', 'false'].includes(value), 'use true or false');
  validateValues('Requires shipping', value => ['true', 'false'].includes(value), 'use true or false');
  validateValues('Continue selling when out of stock', value => ['deny', 'continue'].includes(value), 'use deny or continue');
  validateValues('Weight unit for display', value => ['g', 'kg', 'lb', 'oz'].includes(value), 'use g, kg, lb, or oz');
  validateValues('Weight value (grams)', value => /^\d+$/.test(value), 'use a whole number without a unit');
  validateValues('Price', value => /^\d+(?:\.\d+)?$/.test(value), 'use a number without a currency symbol');
  validateValues('Compare-at price', value => /^\d+(?:\.\d+)?$/.test(value), 'use a number without a currency symbol');
  validateValues('Cost per item', value => /^\d+(?:\.\d+)?$/.test(value), 'use a number without a currency symbol');
  validateValues('Inventory quantity', value => /^-?\d+$/.test(value), 'use a whole number');
  validateValues('Inventory tracker', value => ['shopify', 'shipwire', 'amazon_marketplace_web'].includes(value), 'use shopify, shipwire, amazon_marketplace_web, or leave blank');
  validateValues('Image position', value => /^[1-9]\d*$/.test(value), 'use a positive whole number starting at 1');
  validateValues('Gift card', value => ['true', 'false'].includes(value), 'use true or false');
  validateValues('Fulfillment service', value => ['manual', 'shipwire', 'webgistix', 'amazon_marketplace_web', 'gift_card'].includes(value) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), 'use a supported service or a lowercase custom-service handle');
  validateValues('Tags', value => value.split(',').length <= 250, 'use no more than 250 comma-separated tags');
  validateValues('Collection', value => value.length <= 255, 'use no more than 255 characters');
  validateValues('Product image URL', value => {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }, 'use a public HTTPS image URL');
  validateValues('Variant image URL', value => {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }, 'use a public HTTPS image URL');
  validateValues('Image alt text', value => value.length <= 512, 'use no more than 512 characters');
  validateValues('SEO title', value => value.length <= 70, 'use no more than 70 characters');
  validateValues('SEO description', value => value.length <= 320, 'use no more than 320 characters');

  if (exactIndex('Fulfillment service') >= 0) {
    const builtIns = new Set(['', 'manual', 'shipwire', 'webgistix', 'amazon_marketplace_web', 'gift_card']);
    data.forEach((row, index) => {
      const service = valueAt(row, 'Fulfillment service');
      if (!builtIns.has(service) && !valueAt(row, 'SKU')) {
        issues.push({ type: 'shopify_dependency', row: index + 2, detail: 'A custom Fulfillment service requires a non-blank SKU' });
      }
    });
  }

  if (exactIndex('Product image URL') >= 0 && hasHandle) {
    const imageCounts = new Map();
    data.forEach((row, index) => {
      const handle = valueAt(row, 'URL handle');
      if (!handle || !valueAt(row, 'Product image URL')) return;
      const count = (imageCounts.get(handle) || 0) + 1;
      imageCounts.set(handle, count);
      if (count > 250) issues.push({ type: 'shopify_limit', row: index + 2, detail: `URL handle “${handle}” has more than 250 product images` });
    });
  }

  return issues;
}
