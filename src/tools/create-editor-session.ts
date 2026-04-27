import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateEditorSessionSchema } from "./schemas.js";
import { newRunId } from "../util/ids.js";

export function registerCreateEditorSession(server: McpServer) {
  server.tool(
    "create_editor_session",
    "Create a new editor session",
    CreateEditorSessionSchema.shape,
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              session_id: newRunId(),
              code: "ABCDEF",
              expires_in: 600,
            }),
          },
        ],
      };
    }
  );
}
