import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAll } from "../tools/index.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "design-mcp",
    version: "1.0.0",
  });
  registerAll(server);
  return server;
}
