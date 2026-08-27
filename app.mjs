import { analyze, analyzeShopifyProduct, detectEncoding, serializeCsv } from "./csv.mjs";
const $ = id => document.getElementById(id); let latest; let encodingLabel = "Pasted text (browser Unicode)";
function run() {
  latest = analyze($("input").value);
  const [profile, mode] = $("profile").value.split(":");
  if (profile === "shopify") latest.issues.push(...analyzeShopifyProduct(latest.rows, latest.delimiter, mode));
  $("results").hidden = false;
  $("encoding").textContent = encodingLabel; $("delimiter").textContent = latest.delimiter === "\t" ? "Tab" : latest.delimiter;
  $("rows").textContent = Math.max(0, latest.rows.length - 1); $("count").textContent = latest.issues.length;
  $("issues").replaceChildren(...(latest.issues.length ? latest.issues : [{type:"pass", detail:"No structural issues found"}]).map(issue => {
    const li=document.createElement("li"); const label=document.createElement("b"); const detail=document.createElement("span");
    label.textContent=issue.type.replaceAll("_"," "); detail.textContent=`${issue.row ? `Row ${issue.row}: ` : ""}${issue.detail}`;
    li.append(label,detail); return li;
  }));
  $("results").scrollIntoView({behavior:"smooth"});
}
async function load(file) {
  const bytes = new Uint8Array(await file.arrayBuffer()); const detected = detectEncoding(bytes); encodingLabel = detected.encoding;
  if (!detected.supported) { alert(`${detected.encoding} cannot be safely decoded. Export as UTF-8 and try again.`); return; }
  $("input").value = new TextDecoder("utf-8").decode(bytes.slice(detected.offset)); run();
}
function download(name, content, type) { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),0); }
$("check").onclick=()=>{ encodingLabel="Pasted text (browser Unicode)"; run(); }; $("file").onchange=e=>e.target.files[0]&&load(e.target.files[0]);
$("drop").ondragover=e=>e.preventDefault(); $("drop").ondrop=e=>{e.preventDefault(); if(e.dataTransfer.files[0]) load(e.dataTransfer.files[0]);};
$("csvDownload").onclick=()=>download("cleaned.csv","\uFEFF"+serializeCsv(latest.cleanRows,latest.delimiter),"text/csv;charset=utf-8");
$("reportDownload").onclick=()=>download("preflight-errors.csv",serializeCsv([["type","row","detail"],...latest.issues.map(x=>[x.type,x.row??"",x.detail])]),"text/csv;charset=utf-8");
