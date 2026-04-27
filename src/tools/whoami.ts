import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerWhoami(server: McpServer) {
  server.tool("whoami", "Get current user identity", async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ user_id: "poc-user", email: "dev@legali.ai", plan: "poc" }),
        },
      ],
    };
  });
}
