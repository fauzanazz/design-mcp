import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UnlinkEditorSessionSchema } from "./schemas.js";

export function registerUnlinkEditorSession(server: McpServer) {
  server.tool(
    "unlink_editor_session",
    "Unlink/close an editor session",
    UnlinkEditorSessionSchema.shape,
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ unlinked: true }),
          },
        ],
      };
    }
  );
}
