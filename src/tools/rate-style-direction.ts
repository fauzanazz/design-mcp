import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RateStyleDirectionSchema } from "./schemas.js";
import { createStyleDirection, buildStyleDirectionMemory } from "../store/style-directions.js";

export function registerRateStyleDirection(server: McpServer) {
  server.tool(
    "rate_style_direction",
    "Teach the style memory that a visual direction is amazing or slop",
    RateStyleDirectionSchema.shape,
    async (input) => {
      const row = createStyleDirection({
        source_run_id: input.run_id ?? null,
        quality: input.quality,
        aesthetic: input.aesthetic,
        title: input.title,
        signals: input.signals,
        guidance: input.guidance,
        weight: input.weight,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              id: row.id,
              source_run_id: row.source_run_id,
              quality: row.quality,
              aesthetic: row.aesthetic,
              title: row.title,
              weight: row.weight,
              memory_preview: buildStyleDirectionMemory(row.aesthetic),
            }),
          },
        ],
      };
    }
  );
}
