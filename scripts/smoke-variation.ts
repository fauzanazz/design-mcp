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

const realisticInput = {
  prompt: `SaaS pricing page for a developer-tool product called "Forgelane" — an
AI-assisted code review platform. Three pricing tiers: Free (solo devs, 5 PR/mo),
Pro ($29/mo, unlimited PR + GitHub integration + Slack alerts), Team ($99/mo per
seat, SSO + audit log + priority queue). Above the pricing cards: tight hero with
headline, one-line subhead, and a "Start free" CTA. Below the cards: feature
comparison table (8 rows), then 3 testimonial cards with avatar circles, then an
FAQ accordion with 6 questions, then a footer with 4 link columns and a small
copyright line.`,
  repo_context: {
    summary: "Next.js 15 + Tailwind v4 SaaS marketing site",
    framework: "Next.js 15 (App Router)",
    design_tokens: {
      colors: {
        bg: "#09090b", bg_elevated: "#18181b", border: "#27272a",
        fg: "#fafafa", fg_muted: "#a1a1aa",
        primary: "#a78bfa", primary_fg: "#0a0014",
        accent: "#22d3ee", success: "#34d399", danger: "#f87171",
      },
      fonts: ["Inter Variable", "JetBrains Mono"],
      spacing: ["4", "8", "12", "16", "24", "32", "48", "64", "96"],
    },
    components: [
      { name: "PricingCard" }, { name: "FeatureRow" },
      { name: "TestimonialQuote" }, { name: "FaqItem" },
    ],
  },
  viewport: "desktop" as const,
  mode: "none" as const,
};

const server = new McpServer({ name: "design-mcp-smoke", version: "0.0.1" });
registerAll(server);

const [clientTx, serverTx] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke-client", version: "0.0.1" });
await Promise.all([server.connect(serverTx), client.connect(clientTx)]);

console.log(`=== Running ${N} parallel generations ===`);
console.log("model:", config.model);
console.log();

const t0 = Date.now();
const results = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    const start = Date.now();
    const res: any = await client.callTool(
      { name: "generate_design", arguments: realisticInput },
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
  console.log(`[${i}] run_id=${r.run_id}  wall=${r.wall}ms  bytes=${r.bytes}  ${r.summary}`);
  console.log(`     file: ${r.file}`);
});
console.log();
console.log(`Total wall: ${totalWall}ms`);
console.log();
console.log("Open all:");
results.forEach((r: any) => { if (r.file) console.log(`  open ${r.file}`); });

await client.close();
await server.close();
