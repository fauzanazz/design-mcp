import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExtractCanvasDesignSchema } from "./schemas.js";

export function registerExtractCanvasDesign(server: McpServer) {
  server.tool(
    "extract_canvas_design",
    "Extract design matches from a canvas by query",
    ExtractCanvasDesignSchema.shape,
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ matches: [] }),
          },
        ],
      };
    }
  );
}
