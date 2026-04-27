import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetCreditStatus(server: McpServer) {
  server.tool("get_credit_status", "Get remaining credits and plan info", async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ credits_remaining: 9999, plan: "poc" }),
        },
      ],
    };
  });
}
