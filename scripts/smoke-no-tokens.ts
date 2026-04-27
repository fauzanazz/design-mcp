import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAll } from "../src/tools/index.js";
import { config } from "../src/config.js";

if (!config.useEngine || !config.writeArtifacts) {
  console.error("Set DESIGN_MCP_USE_ENGINE=1 DESIGN_MCP_WRITE_ARTIFACTS=1");
  process.exit(1);
}

const N = Number(process.argv[2] ?? 3);

const noTokensInput = {
  prompt: `SaaS pricing page for a developer-tool product called "Forgelane" — an
AI-assisted code review platform. Three pricing tiers: Free (solo devs, 5 PR/mo),
Pro ($29/mo), Team ($99/mo per seat with SSO). Above the pricing cards: tight hero
with headline, one-line subhead, and a "Start free" CTA. Below the cards: feature
comparison table (8 rows), then 3 testimonial cards, then an FAQ accordion with 6
questions, then a footer with 4 link columns and a small copyright line.`,
  repo_context: "n/a",
  viewport: "desktop" as const,
  mode: "none" as const,
};

const server = new McpServer({ name: "design-mcp-smoke", version: "0.0.1" });
registerAll(server);

const [clientTx, serverTx] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke-client", version: "0.0.1" });
await Promise.all([server.connect(serverTx), client.connect(clientTx)]);

console.log(`=== Running ${N} parallel generations (no tokens — direction drives palette) ===`);
console.log("model:", config.model);
console.log();

const t0 = Date.now();
const results = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    const start = Date.now();
    const res: any = await client.callTool(
      { name: "generate_design", arguments: noTokensInput },
      undefined,
      { timeout: 600_000 },
    );
    const wall = Date.now() - start;
    if (res.isError) return { i, error: JSON.stringify(res, null, 2) };
    const payload = JSON.parse(res.content[0].text);
    const file = resolve(process.cwd(), ".aidesigner/runs", payload.run_id, "design.html");
    return {
      i, run_id: payload.run_id, wall,
      bytes: existsSync(file) ? statSync(file).size : 0,
      summary: payload.summary, file,
    };
  }),
);
const totalWall = Date.now() - t0;

console.log("=== Results ===");
results.forEach((r: any, i: number) => {
  if (r.error) {
    console.log(`[${i}] ERROR: ${r.error}`);
    return;
  }
  console.log(`[${i}] ${r.run_id.slice(0,8)}  wall=${r.wall}ms  ${r.bytes}B  ${r.summary}`);
});
console.log();
console.log(`Total wall: ${totalWall}ms`);
console.log("Open all:");
results.forEach((r: any) => { if (r.file) console.log(`  open ${r.file}`); });

await client.close();
await server.close();
