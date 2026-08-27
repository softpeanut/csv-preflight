import test from "node:test"; import assert from "node:assert/strict"; import { analyze, analyzeShopifyProduct, detectEncoding, guessDelimiter, parseCsv, serializeCsv } from "./csv.mjs";
test("parses quoted delimiters, escaped quotes and newlines",()=>assert.deepEqual(parseCsv('a,b\n"x,y","say ""hi"""\n"two\nlines",z').rows,[['a','b'],['x,y','say "hi"'],['two\nlines','z']]));
test("detects common delimiter",()=>assert.equal(guessDelimiter("a;b;c\n1;2;3\n4;5;6"),";"));
test("reports structural issues without deleting or reshaping data rows",()=>{const r=analyze("name,name,\nAda,A,1\nAda,A,1\nBob,B\nEve,E,2,extra"); assert.deepEqual(r.issues.map(x=>x.type),["duplicate_header","empty_header","duplicate_row","column_count","column_count"]); assert.deepEqual(r.cleanRows,[['name','name_2','column_3'],['Ada','A','1'],['Ada','A','1'],['Bob','B'],['Eve','E','2','extra']]);});
test("serializes values without losing CSV syntax",()=>assert.equal(serializeCsv([["a,b",'x"y'],["line\nbreak",""]]),'"a,b","x""y"\r\n"line\nbreak",\r\n'));
test("surfaces UTF BOM and invalid UTF-8",()=>{assert.equal(detectEncoding(Uint8Array.from([0xef,0xbb,0xbf,65])).encoding,"UTF-8 BOM"); assert.equal(detectEncoding(Uint8Array.from([0xff,0xfe,65,0])).supported,false); assert.equal(detectEncoding(Uint8Array.from([0xc3,0x28])).supported,false);});
test("checks Shopify create and update header contracts without changing rows",()=>{
  const createRows=parseCsv("title,Option1 name,Option1 value\nShirt,Size,M").rows;
  assert.deepEqual(analyzeShopifyProduct(createRows,",","create").map(x=>x.type),["shopify_header_case","shopify_missing_header"]);
  assert.deepEqual(createRows,[['title','Option1 name','Option1 value'],['Shirt','Size','M']]);
  const updateRows=parseCsv("Title,URL handle,SKU\nShirt,shirt-1,ABC").rows;
  assert.deepEqual(analyzeShopifyProduct(updateRows,",","update").map(x=>x.type),["shopify_missing_header","shopify_missing_header"]);
});
test("checks bounded Shopify value rules from the official product CSV guide",()=>{
  const text="Title,URL handle,Option1 name,Option1 value,Status,Price,Weight value (grams),Product image URL,Image alt text\nShirt,bad handle,Size,M,ACTIVE,$19.00,1.5,http://example.com/a.jpg,"+"x".repeat(513);
  const rows=parseCsv(text).rows;
  const issues=analyzeShopifyProduct(rows,",","update");
  assert.deepEqual(issues.map(x=>x.type),Array(6).fill("shopify_value"));
  assert.match(issues[0].detail,/URL handle/);
  assert.match(issues.at(-1).detail,/Image alt text/);
});
test("accepts a narrow valid Shopify update surface",()=>{
  const rows=parseCsv("Title,URL handle,Option1 name,Option1 value,SKU,Status,Price,Weight value (grams),Weight unit for display,Product image URL\nShirt,shirt-1,Size,M,ABC,draft,19.00,150,g,https://example.com/a.jpg").rows;
  assert.deepEqual(analyzeShopifyProduct(rows,",","update"),[]);
});
