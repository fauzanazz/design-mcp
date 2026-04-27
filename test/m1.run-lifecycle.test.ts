import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { unlinkSync } from "node:fs";
import { join } from "node:path";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dbPath = join(tmpdir(), `design-mcp-test-${process.pid}-${Math.random().toString(36).slice(2)}.db`);

// Set before any imports so the lazy DB singleton picks up this path on first access
process.env.DESIGN_MCP_DB_PATH = dbPath;

const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");
const { createMcpServer } = await import("../src/server/mcp.js");
const { resetDb } = await import("../src/store/db.js");
const { Database } = await import("bun:sqlite");

// Force the lazy singleton to open with our test path
resetDb();

function parseResult(result: { content: Array<{ type: string; text?: string }> }) {
  const textItem = result.content.find((c) => c.type === "text");
  expect(textItem).toBeDefined();
  return JSON.parse(textItem!.text!);
}

let client: InstanceType<typeof Client>;

beforeAll(async () => {
  const mcpServer = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  client = new Client({ name: "test-client", version: "0.0.1" });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  resetDb();
  delete process.env.DESIGN_MCP_DB_PATH;
  try { unlinkSync(dbPath); } catch { /* best effort */ }
});

describe("run lifecycle", () => {
  it("generate_design persists a row in the DB", async () => {
    const result = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a login page", repo_context: "my-repo" },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });

    expect(data.run_id).toMatch(UUID_RE);
    expect(data.html.toLowerCase()).toMatch(/^<!doctype/);

    const db = new Database(dbPath, { readonly: true });
    const row = db.query("SELECT * FROM runs WHERE run_id = ?").get(data.run_id) as Record<string, unknown> | null;
    db.close();

    expect(row).not.toBeNull();
    expect(row!.parent_run_id).toBeNull();
    expect(row!.run_id).toBe(data.run_id);
  });

  it("refine_design chains off a prior run", async () => {
    const genResult = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a dashboard", repo_context: "my-repo" },
    });
    const genData = parseResult(genResult as { content: Array<{ type: string; text?: string }> });
    const parentRunId = genData.run_id;

    const refineResult = await client.callTool({
      name: "refine_design",
      arguments: { run_id_or_html: parentRunId, feedback: "make it red", repo_context: "n/a" },
    });
    const refineData = parseResult(refineResult as { content: Array<{ type: string; text?: string }> });

    expect(refineData.run_id).toMatch(UUID_RE);
    expect(refineData.run_id).not.toBe(parentRunId);
    expect(refineData.parent_run_id).toBe(parentRunId);

    const db = new Database(dbPath, { readonly: true });
    const row = db.query("SELECT * FROM runs WHERE run_id = ?").get(refineData.run_id) as Record<string, unknown> | null;
    db.close();

    expect(row).not.toBeNull();
    expect(row!.parent_run_id).toBe(parentRunId);
  });

  it("refine_design with raw HTML creates synthetic parent + child", async () => {
    const rawHtml = "<!doctype html><html></html>";
    const refineResult = await client.callTool({
      name: "refine_design",
      arguments: { run_id_or_html: rawHtml, feedback: "make it blue", repo_context: "n/a" },
    });
    const refineData = parseResult(refineResult as { content: Array<{ type: string; text?: string }> });

    expect(refineData.run_id).toMatch(UUID_RE);
    expect(refineData.parent_run_id).toMatch(UUID_RE);

    const db = new Database(dbPath, { readonly: true });
    const child = db.query("SELECT * FROM runs WHERE run_id = ?").get(refineData.run_id) as Record<string, unknown> | null;
    const parent = db.query("SELECT * FROM runs WHERE run_id = ?").get(refineData.parent_run_id as string) as Record<string, unknown> | null;
    db.close();

    expect(child).not.toBeNull();
    expect(parent).not.toBeNull();
    expect(parent!.prompt).toBe("[imported]");
  });

  it("refine_design with non-existent UUID returns MCP error", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const result = await client.callTool({
      name: "refine_design",
      arguments: { run_id_or_html: fakeId, feedback: "noop", repo_context: "n/a" },
    });

    expect((result as { isError?: boolean }).isError).toBe(true);
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.error).toBe("parent run not found");
  });
});
