import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinkEditorSessionSchema } from "./schemas.js";
import { newRunId } from "../util/ids.js";

export function registerLinkEditorSession(server: McpServer) {
  server.tool(
    "link_editor_session",
    "Link a client to an editor session using a 6-char code",
    LinkEditorSessionSchema.shape,
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              session_id: newRunId(),
              canvas_id: newRunId(),
              linked: true,
            }),
          },
        ],
      };
    }
  );
}
