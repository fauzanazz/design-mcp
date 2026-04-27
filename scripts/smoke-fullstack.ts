import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAll } from "../src/tools/index.js";
import { config } from "../src/config.js";

console.log("=== Config ===");
console.log("useEngine:    ", config.useEngine);
console.log("writeArtifacts:", config.writeArtifacts);
console.log("model:        ", config.model);
console.log("dbPath:       ", config.dbPath);
console.log();

if (!config.useEngine || !config.writeArtifacts) {
  console.error("Both DESIGN_MCP_USE_ENGINE=1 and DESIGN_MCP_WRITE_ARTIFACTS=1 required.");
  process.exit(1);
}

const server = new McpServer({ name: "design-mcp-smoke", version: "0.0.1" });
registerAll(server);

const [clientTx, serverTx] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke-client", version: "0.0.1" });

await Promise.all([server.connect(serverTx), client.connect(clientTx)]);

console.log("=== Calling generate_design ===");
const t0 = Date.now();
const res: any = await client.callTool({
  name: "generate_design",
  arguments: {
    prompt: "minimal red landing page with hero h1, subtitle, and a single CTA button",
    repo_context: "n/a",
    viewport: "desktop",
    mode: "none",
  },
}, undefined, { timeout: 600_000 });
const wallMs = Date.now() - t0;

if (res.isError) {
  console.error("Tool returned error:", JSON.stringify(res, null, 2));
  process.exit(1);
}

const payload = JSON.parse(res.content[0].text);
console.log("run_id:       ", payload.run_id);
console.log("html bytes:   ", payload.html.length);
console.log("summary:      ", payload.summary);
console.log("wall ms:      ", wallMs);
console.log();

const artifactDir = resolve(process.cwd(), ".aidesigner/runs", payload.run_id);
const designHtml = resolve(artifactDir, "design.html");
const requestJson = resolve(artifactDir, "request.json");
const summaryJson = resolve(artifactDir, "summary.json");
const latestJson = resolve(process.cwd(), ".aidesigner/latest.json");

console.log("=== Artifact verification ===");
for (const path of [designHtml, requestJson, summaryJson, latestJson]) {
  const ok = existsSync(path);
  const size = ok ? statSync(path).size : 0;
  console.log(`${ok ? "[OK]" : "[--]"} ${path}  (${size}B)`);
}

console.log();
console.log("=== latest.json ===");
console.log(readFileSync(latestJson, "utf8"));

console.log("=== summary.json ===");
console.log(readFileSync(summaryJson, "utf8"));

console.log("=== design.html (first 300 chars) ===");
console.log(readFileSync(designHtml, "utf8").slice(0, 300));

console.log();
console.log("Open in browser:");
console.log(`  open ${designHtml}`);

await client.close();
await server.close();
