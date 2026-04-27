import { existsSync, statSync } from "node:fs";
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
console.log();

if (!config.useEngine || !config.writeArtifacts) {
  console.error("Set DESIGN_MCP_USE_ENGINE=1 DESIGN_MCP_WRITE_ARTIFACTS=1");
  process.exit(1);
}

const realisticInput = {
  prompt: `SaaS pricing page for a developer-tool product called "Forgelane" — an
AI-assisted code review platform. Three pricing tiers: Free (solo devs, 5 PR/mo),
Pro ($29/mo, unlimited PR + GitHub integration + Slack alerts), Team ($99/mo per
seat, SSO + audit log + priority queue). Above the pricing cards: tight hero with
headline, one-line subhead, and a "Start free" CTA. Below the cards: feature
comparison table (8 rows), then 3 testimonial cards with avatar circles, then an
FAQ accordion with 6 questions, then a footer with 4 link columns and a small
copyright line. Modern dark aesthetic with subtle gradients and sharp typography.`,
  repo_context: {
    summary: "Next.js 15 + Tailwind v4 SaaS marketing site",
    framework: "Next.js 15 (App Router)",
    design_tokens: {
      colors: {
        bg: "#09090b",
        bg_elevated: "#18181b",
        border: "#27272a",
        fg: "#fafafa",
        fg_muted: "#a1a1aa",
        primary: "#a78bfa",
        primary_fg: "#0a0014",
        accent: "#22d3ee",
        success: "#34d399",
        danger: "#f87171",
      },
      fonts: ["Inter Variable", "JetBrains Mono"],
      spacing: ["4", "8", "12", "16", "24", "32", "48", "64", "96"],
    },
    components: [
      { name: "PricingCard", description: "Tier card with title, price, feature list, CTA" },
      { name: "FeatureRow", description: "Comparison table row, supports check/dash/text" },
      { name: "TestimonialQuote", description: "Avatar + quote + name/title" },
      { name: "FaqItem", description: "Click-to-expand question with smooth height transition" },
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

console.log("=== Calling generate_design (realistic + opus) ===");
console.log("prompt bytes:", realisticInput.prompt.length);
console.log("repo_context tokens:", Object.keys(realisticInput.repo_context.design_tokens.colors).length, "colors,",
            realisticInput.repo_context.components.length, "components");
console.log();

const t0 = Date.now();
const res: any = await client.callTool(
  { name: "generate_design", arguments: realisticInput },
  undefined,
  { timeout: 300_000 },
);
const wallMs = Date.now() - t0;

if (res.isError) {
  console.error("Tool returned error:", JSON.stringify(res, null, 2));
  process.exit(1);
}

const payload = JSON.parse(res.content[0].text);
console.log("=== Result ===");
console.log("run_id:    ", payload.run_id);
console.log("html bytes:", payload.html.length);
console.log("summary:   ", payload.summary);
console.log("wall ms:   ", wallMs);

const designHtml = resolve(process.cwd(), ".aidesigner/runs", payload.run_id, "design.html");
const ok = existsSync(designHtml);
console.log("artifact:  ", ok ? `[OK] ${designHtml} (${statSync(designHtml).size}B)` : "[MISSING]");
console.log();
console.log("Open in browser:");
console.log(`  open ${designHtml}`);

await client.close();
await server.close();
