import { join, resolve, relative } from "node:path";
import { mkdirSync, renameSync } from "node:fs";
import type { Run } from "../store/types.js";
import { config } from "../config.js";

type WriterOptions = {
  basePath?: string;
};

export async function writeRunArtifacts(run: Run, options: WriterOptions = {}): Promise<void> {
  if (!config.writeArtifacts && process.env.DESIGN_MCP_WRITE_ARTIFACTS !== "1") return;

  const base = resolve(options.basePath ?? config.artifactBasePath);
  const root = resolve(base, ".aidesigner");
  const runDir = resolve(root, "runs", run.run_id);
  if (relative(root, runDir).startsWith("..")) {
    throw new Error("artifact path escapes configured root");
  }
  mkdirSync(runDir, { recursive: true });

  await Bun.write(join(runDir, "design.html"), run.html ?? "");

  const requestPayload = JSON.stringify(
    {
      prompt: run.prompt,
      repo_context: run.repo_context,
      viewport: run.viewport,
      mode: run.mode,
      url: run.url,
      parent_run_id: run.parent_run_id,
    },
    null,
    2
  );
  await Bun.write(join(runDir, "request.json"), requestPayload);

  const summaryPayload = JSON.stringify(
    { run_id: run.run_id, summary: run.summary, created_at: run.created_at },
    null,
    2
  );
  await Bun.write(join(runDir, "summary.json"), summaryPayload);

  const latestPayload = JSON.stringify(
    { run_id: run.run_id, path: `.aidesigner/runs/${run.run_id}` },
    null,
    2
  );
  const latestPath = join(base, ".aidesigner", "latest.json");
  const tmpPath = latestPath + ".tmp";
  await Bun.write(tmpPath, latestPayload);
  // Atomic rename so readers never see a partial write
  renameSync(tmpPath, latestPath);
}
