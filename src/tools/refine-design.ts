import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RefineDesignSchema } from "./schemas.js";
import { newRunId } from "../util/ids.js";
import { createRun, getRun } from "../store/runs.js";
import { writeRunArtifacts } from "../artifacts/writer.js";
import { config } from "../config.js";
import { generateDesign, EngineOutputInvalidError } from "../engine/claude.js";
import { engineSemaphore } from "../engine/concurrency.js";
import { logger } from "../util/log.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CANNED_HTML =
  "<!doctype html><html><head><title>Stub</title></head><body><h1>Stub design</h1></body></html>";

export function registerRefineDesign(server: McpServer) {
  server.tool(
    "refine_design",
    "Refine an existing design with feedback",
    RefineDesignSchema.shape,
    async (input) => {
      const repo_context =
        typeof input.repo_context === "string"
          ? input.repo_context
          : JSON.stringify(input.repo_context);

      let parentRunId: string;
      let priorHtml: string | undefined;

      if (UUID_RE.test(input.run_id_or_html)) {
        const parent = getRun(input.run_id_or_html);
        if (!parent) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ error: "parent run not found" }) }],
          };
        }
        parentRunId = parent.run_id;
        priorHtml = parent.html ?? undefined;
      } else {
        // Raw HTML import — create synthetic parent to anchor the chain
        const syntheticId = newRunId();
        createRun({
          run_id: syntheticId,
          parent_run_id: null,
          prompt: "[imported]",
          repo_context: "[imported]",
          viewport: "desktop",
          mode: "none",
          url: null,
          html: input.run_id_or_html,
          summary: null,
        });
        parentRunId = syntheticId;
        priorHtml = input.run_id_or_html;
      }

      const run_id = newRunId();
      const viewport = "desktop";
      const mode = input.mode ?? "none";

      if (config.useEngine) {
        const release = await engineSemaphore.acquire();
        try {
          const result = await generateDesign({
            prompt: input.feedback,
            repoContext: input.repo_context,
            viewport,
            mode,
            url: input.url,
            priorHtml,
            feedback: input.feedback,
          });

          const run = createRun({
            run_id,
            parent_run_id: parentRunId,
            prompt: input.feedback,
            repo_context,
            viewport,
            mode,
            url: input.url ?? null,
            html: result.html,
            summary: `refined via engine; cost $${result.costUsd.toFixed(5)}; ${result.durationMs}ms`,
          });

          await writeRunArtifacts(run);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ run_id, parent_run_id: parentRunId, html: result.html, summary: run.summary }),
              },
            ],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error("engine error in refine_design", { message });

          createRun({
            run_id,
            parent_run_id: parentRunId,
            prompt: input.feedback,
            repo_context,
            viewport,
            mode,
            url: input.url ?? null,
            html: null,
            summary: `engine error: ${message}`,
          });

          return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ error: message, run_id }) }],
          };
        } finally {
          release();
        }
      }

      const refinedHtml = CANNED_HTML.replace(
        "</body>",
        `<!-- refined: ${run_id} --></body>`
      );

      const run = createRun({
        run_id,
        parent_run_id: parentRunId,
        prompt: input.feedback,
        repo_context,
        viewport,
        mode,
        url: input.url ?? null,
        html: refinedHtml,
        summary: "M1 canned refine",
      });

      await writeRunArtifacts(run);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              run_id,
              parent_run_id: parentRunId,
              html: refinedHtml,
              summary: run.summary,
            }),
          },
        ],
      };
    }
  );
}
