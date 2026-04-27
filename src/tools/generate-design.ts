import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GenerateDesignSchema } from "./schemas.js";
import { newRunId } from "../util/ids.js";
import { createRun } from "../store/runs.js";
import { writeRunArtifacts } from "../artifacts/writer.js";
import { config } from "../config.js";
import { generateDesign, EngineOutputInvalidError } from "../engine/claude.js";
import { pickAestheticDirection } from "../engine/prompts.js";
import { refineRepoContext } from "../engine/refine-tokens.js";
import { engineSemaphore } from "../engine/concurrency.js";
import { logger } from "../util/log.js";

const CANNED_HTML =
  "<!doctype html><html><head><title>Stub</title></head><body><h1>Stub design</h1></body></html>";

const ANIMATION_REFINEMENT_FEEDBACK = `Add a compact final animation layer to the existing layout.

Preserve layout, copy, hierarchy, semantic HTML, palette, typography, spacing, and aesthetic direction. Modify only CSS and animation-specific JavaScript. Use GSAP via CDN only when it improves the entrance timeline or sequencing; otherwise CSS is enough. Include reduced-motion handling.`;

function buildReviewPrompt(run_id: string): string {
  return [
    "Review this generated design and teach the style memory:",
    "- If it looks strong, call `rate_style_direction` with `quality: \"amazing\"`.",
    "- If it looks generic/slop, call `rate_style_direction` with `quality: \"slop\"`.",
    `- Include \`run_id: "${run_id}"\`, the aesthetic, visible signals, and guidance for future generations.`,
  ].join("\n");
}

export function registerGenerateDesign(server: McpServer) {
  server.tool(
    "generate_design",
    "Generate a UI design from a prompt and repo context",
    GenerateDesignSchema.shape,
    async (input) => {
      const run_id = newRunId();
      const viewport = input.viewport ?? "desktop";
      const mode = input.mode ?? "none";
      const repo_context =
        typeof input.repo_context === "string"
          ? input.repo_context
          : JSON.stringify(input.repo_context);

      if (config.useEngine) {
        const release = await engineSemaphore.acquire();
        try {
          let effectiveRepoContext: string | object = input.repo_context;
          let refinementResult: Awaited<ReturnType<typeof refineRepoContext>> | null = null;

          if (config.refineTokens) {
            refinementResult = await refineRepoContext(input.repo_context);
            if (refinementResult.refined !== null) {
              effectiveRepoContext = refinementResult.refined;
            }
          }

          const aestheticDirection = pickAestheticDirection();
          const layoutResult = await generateDesign({
            prompt: input.prompt,
            repoContext: effectiveRepoContext,
            viewport,
            mode,
            url: input.url,
            phase: input.animate_after_layout ? "layout" : "full",
            aestheticDirection,
          });

          const result = input.animate_after_layout
            ? await generateDesign({
                prompt: input.prompt,
                repoContext: effectiveRepoContext,
                viewport,
                mode,
                url: input.url,
                priorHtml: layoutResult.html,
                feedback: ANIMATION_REFINEMENT_FEEDBACK,
                phase: "animation",
                aestheticDirection,
                model: config.animationModel,
              })
            : layoutResult;

          const totalCostUsd = layoutResult.costUsd
            + (input.animate_after_layout ? result.costUsd : 0)
            + (refinementResult?.costUsd ?? 0);
          const totalDurationMs = layoutResult.durationMs
            + (input.animate_after_layout ? result.durationMs : 0);
          const refineSummary = refinementResult !== null && refinementResult.refined !== null
            ? `; refined tokens via haiku ($${refinementResult.costUsd.toFixed(5)}); reason: ${refinementResult.reason}`
            : "";
          const animationSummary = input.animate_after_layout
            ? `; animation pass enabled; animation model ${config.animationModel}`
            : "";

          const run = createRun({
            run_id,
            parent_run_id: null,
            prompt: input.prompt,
            repo_context,
            viewport,
            mode,
            url: input.url ?? null,
            html: result.html,
            summary: `generated via engine${animationSummary}; cost $${totalCostUsd.toFixed(5)}; ${totalDurationMs}ms${refineSummary}`,
          });

          await writeRunArtifacts(run);
          const review_prompt = buildReviewPrompt(run_id);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  run_id,
                  html: result.html,
                  viewport,
                  mode,
                  summary: run.summary,
                  animate_after_layout: input.animate_after_layout ?? false,
                  review_prompt,
                  repo_context_refined: refinementResult?.refined ?? null,
                  refinement_reason: refinementResult?.reason ?? null,
                }),
              },
            ],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error("engine error in generate_design", { message });

          createRun({
            run_id,
            parent_run_id: null,
            prompt: input.prompt,
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

      const run = createRun({
        run_id,
        parent_run_id: null,
        prompt: input.prompt,
        repo_context,
        viewport,
        mode,
        url: input.url ?? null,
        html: CANNED_HTML,
        summary: "M1 canned generate",
      });

      await writeRunArtifacts(run);
      const review_prompt = buildReviewPrompt(run_id);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              run_id,
              html: CANNED_HTML,
              viewport,
              mode,
              summary: run.summary,
              animate_after_layout: input.animate_after_layout ?? false,
              review_prompt,
            }),
          },
        ],
      };
    }
  );
}
