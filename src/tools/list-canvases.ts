import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerListCanvases(server: McpServer) {
  server.tool("list_canvases", "List all canvases", async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ canvases: [] }),
        },
      ],
    };
  });
}
