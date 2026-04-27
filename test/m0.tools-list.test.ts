import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/server/mcp.js";

const EXPECTED_TOOLS = [
  "generate_design",
  "refine_design",
  "get_credit_status",
  "whoami",
  "create_editor_session",
  "link_editor_session",
  "unlink_editor_session",
  "list_canvases",
  "get_canvas",
  "extract_canvas_design",
  "rate_style_direction",
];

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

describe("tools/list", () => {
  it("advertises exactly 11 tools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("generate_design schema has required and optional fields", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "generate_design")!;
    const schema = tool.inputSchema as { properties: Record<string, unknown>; required?: string[] };

    expect(schema.properties).toHaveProperty("prompt");
    expect(schema.properties).toHaveProperty("repo_context");
    expect(schema.properties).toHaveProperty("viewport");
    expect(schema.properties).toHaveProperty("mode");
    expect(schema.properties).toHaveProperty("url");
    expect(schema.properties).toHaveProperty("animate_after_layout");

    expect(schema.required).toContain("prompt");
    expect(schema.required).toContain("repo_context");
  });

  it("rate_style_direction schema has feedback fields", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "rate_style_direction")!;
    const schema = tool.inputSchema as { properties: Record<string, unknown>; required?: string[] };

    expect(schema.properties).toHaveProperty("run_id");
    expect(schema.properties).toHaveProperty("quality");
    expect(schema.properties).toHaveProperty("aesthetic");
    expect(schema.properties).toHaveProperty("title");
    expect(schema.properties).toHaveProperty("signals");
    expect(schema.properties).toHaveProperty("guidance");
    expect(schema.properties).toHaveProperty("weight");

    expect(schema.required).toContain("quality");
    expect(schema.required).toContain("title");
    expect(schema.required).toContain("signals");
    expect(schema.required).toContain("guidance");
  });
});
