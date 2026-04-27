import { generateDesign } from "../src/engine/claude.js";

const start = Date.now();
const result = await generateDesign({
  prompt: "minimal red landing page with a hero h1, subtitle, and a single CTA button",
  repoContext: "n/a",
  viewport: "desktop",
  mode: "none",
});

console.log("=== Smoke test result ===");
console.log("Model:        ", result.model);
console.log("Duration (ms):", result.durationMs);
console.log("Total wall ms:", Date.now() - start);
console.log("Cost (USD):   ", result.costUsd);
console.log("HTML bytes:   ", result.html.length);
console.log("Starts w/ DOCTYPE:", /^<!doctype/i.test(result.html));
console.log("Ends w/ </html>:  ", /<\/html>\s*$/i.test(result.html));
console.log("--- first 400 chars ---");
console.log(result.html.slice(0, 400));
console.log("--- last 200 chars ---");
console.log(result.html.slice(-200));
