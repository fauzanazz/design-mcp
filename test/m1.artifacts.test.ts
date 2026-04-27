import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { unlinkSync, rmSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dbPath = join(tmpdir(), `design-mcp-art-test-${process.pid}-${Math.random().toString(36).slice(2)}.db`);
const artifactBase = join(tmpdir(), `design-mcp-art-base-${process.pid}-${Math.random().toString(36).slice(2)}`);

process.env.DESIGN_MCP_DB_PATH = dbPath;

const { writeRunArtifacts } = await import("../src/artifacts/writer.js");
const { resetDb } = await import("../src/store/db.js");
resetDb();

const sampleRun = {
  run_id: "11111111-1111-1111-1111-111111111111",
  parent_run_id: null,
  prompt: "test prompt",
  repo_context: "my-repo",
  viewport: "desktop",
  mode: "none",
  url: null,
  html: "<!doctype html><html><body>test</body></html>",
  summary: "test summary",
  created_at: 1700000000000,
};

const sampleRun2 = {
  ...sampleRun,
  run_id: "22222222-2222-2222-2222-222222222222",
  summary: "test summary 2",
};

beforeAll(() => {
  mkdirSync(artifactBase, { recursive: true });
});

afterAll(() => {
  resetDb();
  delete process.env.DESIGN_MCP_DB_PATH;
  try { unlinkSync(dbPath); } catch { /* best effort */ }
  try { rmSync(artifactBase, { recursive: true, force: true }); } catch { /* best effort */ }
});

describe("artifact writer", () => {
  it("writes design.html, request.json, summary.json when flag is set", async () => {
    process.env.DESIGN_MCP_WRITE_ARTIFACTS = "1";

    await writeRunArtifacts(sampleRun, { basePath: artifactBase });

    const runDir = join(artifactBase, ".aidesigner", "runs", sampleRun.run_id);
    expect(existsSync(join(runDir, "design.html"))).toBe(true);
    expect(existsSync(join(runDir, "request.json"))).toBe(true);
    expect(existsSync(join(runDir, "summary.json"))).toBe(true);

    const html = readFileSync(join(runDir, "design.html"), "utf8");
    expect(html).toBe(sampleRun.html);

    const request = JSON.parse(readFileSync(join(runDir, "request.json"), "utf8"));
    expect(request.prompt).toBe("test prompt");
    expect(request.viewport).toBe("desktop");

    const summary = JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8"));
    expect(summary.run_id).toBe(sampleRun.run_id);
    expect(summary.summary).toBe("test summary");
  });

  it("writes latest.json pointing at the new run", async () => {
    process.env.DESIGN_MCP_WRITE_ARTIFACTS = "1";

    await writeRunArtifacts(sampleRun, { basePath: artifactBase });
    const latest = JSON.parse(readFileSync(join(artifactBase, ".aidesigner", "latest.json"), "utf8"));
    expect(latest.run_id).toBe(sampleRun.run_id);
    expect(latest.path).toBe(`.aidesigner/runs/${sampleRun.run_id}`);
  });

  it("updates latest.json atomically on second run", async () => {
    process.env.DESIGN_MCP_WRITE_ARTIFACTS = "1";

    await writeRunArtifacts(sampleRun, { basePath: artifactBase });
    await writeRunArtifacts(sampleRun2, { basePath: artifactBase });

    const latest = JSON.parse(readFileSync(join(artifactBase, ".aidesigner", "latest.json"), "utf8"));
    expect(latest.run_id).toBe(sampleRun2.run_id);
  });

  it("writes no files when flag is unset", async () => {
    delete process.env.DESIGN_MCP_WRITE_ARTIFACTS;

    const isolatedBase = join(tmpdir(), `design-mcp-noop-${Math.random().toString(36).slice(2)}`);
    await writeRunArtifacts(sampleRun, { basePath: isolatedBase });

    const runDir = join(isolatedBase, ".aidesigner", "runs", sampleRun.run_id);
    expect(existsSync(runDir)).toBe(false);
  });
});
