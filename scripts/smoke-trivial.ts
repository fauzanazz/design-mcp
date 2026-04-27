import { generateDesign } from "../src/engine/claude.js";

const t0 = Date.now();
const result = await generateDesign({
  prompt: "Output a one-line landing page that just says 'Hello world' as h1.",
  repoContext: "n/a",
  viewport: "desktop",
  mode: "none",
});
console.log("Wall:", Date.now() - t0, "ms");
console.log("Cost:", result.costUsd);
console.log("Bytes:", result.html.length);
console.log("Direction:", result.direction);
console.log(result.html.slice(0, 300));
