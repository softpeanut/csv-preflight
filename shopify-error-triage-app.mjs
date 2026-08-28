import { classifyShopifyError } from "./shopify-error-triage.mjs";

const required = [
  "triage-form",
  "error-text",
  "triage-result",
  "result-status",
  "result-title",
  "result-cause",
  "result-next",
  "result-scope",
  "result-source",
];

const nodes = Object.fromEntries(required.map((id) => [id, document.getElementById(id)]));
const missing = required.filter((id) => !nodes[id]);
if (missing.length) throw new Error(`Shopify error triage is missing required nodes: ${missing.join(", ")}`);

function setText(node, value) {
  node.textContent = value ?? "";
}

function render(result) {
  nodes["triage-result"].hidden = false;
  nodes["result-cause"].hidden = result.status !== "matched";
  nodes["result-scope"].hidden = result.status !== "matched";

  if (result.status === "empty") {
    setText(nodes["result-status"], "INPUT NEEDED");
    setText(nodes["result-title"], "Paste only Shopify's exact error message.");
    setText(nodes["result-next"], "Do not paste CSV rows, product data, customer data, credentials, or private links.");
    nodes["result-source"].removeAttribute("href");
    setText(nodes["result-source"], "No text was analyzed");
    return;
  }

  if (result.status === "too_long") {
    setText(nodes["result-status"], "INPUT TOO LONG");
    setText(nodes["result-title"], `Use only the exact error message, up to ${result.maxLength} characters.`);
    setText(nodes["result-next"], "Remove surrounding CSV content, email text, store details, and other context before trying again.");
    nodes["result-source"].removeAttribute("href");
    setText(nodes["result-source"], "No text was analyzed");
    return;
  }

  if (result.status === "unknown") {
    setText(nodes["result-status"], "NO DOCUMENTED MATCH");
    setText(nodes["result-title"], result.title);
    setText(nodes["result-next"], result.nextStep);
  } else {
    setText(nodes["result-status"], result.confidence === "official-documented" ? "DOCUMENTED MATCH" : "COMMUNITY-OBSERVED MATCH");
    setText(nodes["result-title"], result.title);
    setText(nodes["result-cause"], `Likely cause: ${result.cause}`);
    setText(nodes["result-next"], `Next safe step: ${result.nextStep}`);
    setText(nodes["result-scope"], `${result.scopeLabel}: ${result.checkerFit}`);
  }

  nodes["result-source"].href = result.sourceUrl;
  setText(nodes["result-source"], `Source: ${result.sourceLabel}`);
}

nodes["triage-form"].addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    render(classifyShopifyError(nodes["error-text"].value));
  } catch {
    render({
      status: "unknown",
      title: "This message could not be classified locally",
      nextStep: "Use Shopify's current troubleshooting page. No input was stored or sent.",
      sourceUrl: "https://help.shopify.com/en/manual/products/import-export/common-import-issues",
      sourceLabel: "Shopify Help Center",
    });
  }
});
