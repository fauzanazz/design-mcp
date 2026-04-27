import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCanvasSchema } from "./schemas.js";

export function registerGetCanvas(server: McpServer) {
  server.tool(
    "get_canvas",
    "Get a canvas by ID",
    GetCanvasSchema.shape,
    async (input) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ canvas_id: input.canvas_id, title: "stub", runs: [] }),
          },
        ],
      };
    }
  );
}
