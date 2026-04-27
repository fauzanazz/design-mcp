import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/server/mcp.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let client: Client;

beforeAll(async () => {
  const mcpServer = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  client = new Client({ name: "test-client", version: "0.0.1" });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
});

function parseResult(result: { content: Array<{ type: string; text?: string }> }) {
  const textItem = result.content.find((c) => c.type === "text");
  expect(textItem).toBeDefined();
  return JSON.parse(textItem!.text!);
}

describe("canned responses", () => {
  it("generate_design returns run_id (UUID) and html starting with <!doctype", async () => {
    const result = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a login page", repo_context: "my-repo" },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.run_id).toMatch(UUID_RE);
    expect(data.html.toLowerCase()).toMatch(/^<!doctype/);
    expect(data.viewport).toBe("desktop");
    expect(data.mode).toBe("none");
    expect(data.summary).toBe("M1 canned generate");
    expect(data.review_prompt).toContain("rate_style_direction");
    expect(data.review_prompt).toContain(data.run_id);
  });

  it("generate_design respects viewport and mode params", async () => {
    const result = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a dashboard", repo_context: "my-repo", viewport: "mobile", mode: "clone", url: "https://example.com" },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.viewport).toBe("mobile");
    expect(data.mode).toBe("clone");
  });

  it("generate_design accepts optional animation pass flag", async () => {
    const result = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a dashboard", repo_context: "my-repo", animate_after_layout: true },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.animate_after_layout).toBe(true);
  });

  it("refine_design returns run_id and parent_run_id when chaining off a persisted run", async () => {
    // First create a real persisted run to chain off
    const genResult = await client.callTool({
      name: "generate_design",
      arguments: { prompt: "a page", repo_context: "my-repo" },
    });
    const genData = parseResult(genResult as { content: Array<{ type: string; text?: string }> });
    const parentId = genData.run_id;

    const result = await client.callTool({
      name: "refine_design",
      arguments: { run_id_or_html: parentId, feedback: "make it blue", repo_context: "my-repo" },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.run_id).toMatch(UUID_RE);
    expect(data.parent_run_id).toBe(parentId);
    expect(data.html.toLowerCase()).toMatch(/^<!doctype/);
  });

  it("refine_design with raw HTML creates a synthetic parent (parent_run_id is a UUID)", async () => {
    const result = await client.callTool({
      name: "refine_design",
      arguments: { run_id_or_html: "<html>prior</html>", feedback: "tweak", repo_context: "my-repo" },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    // M1: raw HTML creates a synthetic parent row; parent_run_id is that synthetic UUID
    expect(data.parent_run_id).toMatch(UUID_RE);
  });

  it("get_credit_status returns credits and plan", async () => {
    const result = await client.callTool({ name: "get_credit_status", arguments: {} });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.credits_remaining).toBe(9999);
    expect(data.plan).toBe("poc");
  });

  it("whoami returns user identity", async () => {
    const result = await client.callTool({ name: "whoami", arguments: {} });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.user_id).toBe("poc-user");
    expect(data.email).toBe("dev@legali.ai");
    expect(data.plan).toBe("poc");
  });

  it("create_editor_session returns session_id and code", async () => {
    const result = await client.callTool({ name: "create_editor_session", arguments: {} });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.session_id).toMatch(UUID_RE);
    expect(data.code).toBe("ABCDEF");
    expect(data.expires_in).toBe(600);
  });

  it("link_editor_session returns session_id, canvas_id, and linked=true", async () => {
    const result = await client.callTool({ name: "link_editor_session", arguments: { code: "ABCDEF" } });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.session_id).toMatch(UUID_RE);
    expect(data.canvas_id).toMatch(UUID_RE);
    expect(data.linked).toBe(true);
  });

  it("unlink_editor_session returns unlinked=true", async () => {
    const result = await client.callTool({ name: "unlink_editor_session", arguments: { session_id: "some-session" } });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.unlinked).toBe(true);
  });

  it("list_canvases returns empty array", async () => {
    const result = await client.callTool({ name: "list_canvases", arguments: {} });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(Array.isArray(data.canvases)).toBe(true);
    expect(data.canvases).toHaveLength(0);
  });

  it("get_canvas returns canvas_id, title, and runs", async () => {
    const result = await client.callTool({ name: "get_canvas", arguments: { canvas_id: "my-canvas" } });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.canvas_id).toBe("my-canvas");
    expect(data.title).toBe("stub");
    expect(Array.isArray(data.runs)).toBe(true);
  });

  it("extract_canvas_design returns matches array", async () => {
    const result = await client.callTool({ name: "extract_canvas_design", arguments: { query: "login" } });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(Array.isArray(data.matches)).toBe(true);
  });

  it("rate_style_direction stores user taste feedback", async () => {
    const result = await client.callTool({
      name: "rate_style_direction",
      arguments: {
        quality: "amazing",
        aesthetic: "editorial / magazine",
        title: "Sharp newspaper landing",
        signals: "oversized serif, strict grid, confident red spot color",
        guidance: "Use newspaper-like hierarchy and rules for serious product surfaces.",
        weight: 7,
      },
    });
    const data = parseResult(result as { content: Array<{ type: string; text?: string }> });
    expect(data.id).toMatch(UUID_RE);
    expect(data.quality).toBe("amazing");
    expect(data.aesthetic).toBe("editorial / magazine");
    expect(data.memory_preview).toContain("Sharp newspaper landing");
  });
});
