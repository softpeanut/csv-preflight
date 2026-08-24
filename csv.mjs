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
    const widths = lines.map(line => parseCsv(line, delimiter).rows[0].length);
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
  const seenRows = new Map(); const cleanData = [];
  data.forEach((row, index) => {
    const number = index + 2;
    if (row.length !== headers.length) issues.push({ type: "column_count", row: number, detail: `Expected ${headers.length} columns, found ${row.length}` });
    const key = JSON.stringify(row);
    if (seenRows.has(key)) issues.push({ type: "duplicate_row", row: number, detail: `Duplicates row ${seenRows.get(key)}` });
    else { seenRows.set(key, number); cleanData.push([...row]); }
  });
  const cleanHeaders = headers.map((value, index) => value.trim() || `column_${index + 1}`).map((value, index, all) => {
    const prior = all.slice(0, index).filter(item => item === value).length;
    return prior ? `${value}_${prior + 1}` : value;
  });
  const cleanRows = [cleanHeaders, ...cleanData.map(row => cleanHeaders.map((_, i) => row[i] ?? ""))];
  return { delimiter, rows: parsed.rows, cleanRows, issues };
}

export function serializeCsv(rows, delimiter = ",") {
  return rows.map(row => row.map(value => {
    const text = String(value ?? "");
    return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(delimiter)).join("\r\n") + "\r\n";
}
