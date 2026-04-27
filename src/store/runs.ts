import { getDb } from "./db.js";
import type { Run } from "./types.js";

type CreateRunInput = Omit<Run, "created_at">;

export function createRun(input: CreateRunInput): Run {
  const row: Run = { ...input, created_at: Date.now() };
  getDb().run(
    `INSERT INTO runs (run_id, parent_run_id, prompt, repo_context, viewport, mode, url, html, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.run_id, row.parent_run_id, row.prompt, row.repo_context, row.viewport, row.mode, row.url, row.html, row.summary, row.created_at]
  );
  return row;
}

export function getRun(run_id: string): Run | null {
  return getDb().query<Run, string>("SELECT * FROM runs WHERE run_id = ?").get(run_id);
}

export function listChildren(parent_run_id: string): Run[] {
  return getDb().query<Run, string>("SELECT * FROM runs WHERE parent_run_id = ?").all(parent_run_id);
}
