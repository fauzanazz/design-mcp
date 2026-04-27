import { describe, it, expect, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { unlinkSync } from "node:fs";
import { join } from "node:path";

const dbPath = join(tmpdir(), `design-mcp-style-test-${process.pid}-${Math.random().toString(36).slice(2)}.db`);
process.env.DESIGN_MCP_DB_PATH = dbPath;

const { resetDb } = await import("../src/store/db.js");
const { createStyleDirection, listStyleDirections, buildStyleDirectionMemory } = await import("../src/store/style-directions.js");

resetDb();

afterAll(() => {
  resetDb();
  delete process.env.DESIGN_MCP_DB_PATH;
  try { unlinkSync(dbPath); } catch { /* best effort */ }
});

describe("style direction memory", () => {
  it("seeds amazing and slop style directions", () => {
    const rows = listStyleDirections("editorial / magazine");
    expect(rows.some((row) => row.quality === "amazing")).toBe(true);
    expect(rows.some((row) => row.quality === "slop")).toBe(true);
  });

  it("builds prompt-ready taste guidance", () => {
    const memory = buildStyleDirectionMemory("luxury / refined");
    expect(memory).toContain("Amazing examples to emulate");
    expect(memory).toContain("Slop patterns to avoid");
    expect(memory).toContain("AI SaaS blob stack");
  });

  it("stores user-labeled taste examples", () => {
    const row = createStyleDirection({
      quality: "slop",
      aesthetic: "all",
      title: "Decorative gradient soup",
      signals: "too many gradients, vague blobs, no product-specific structure",
      guidance: "Replace generic gradient decoration with context-specific layout and artifact detail.",
      weight: 9,
    });

    expect(row.id).toBeString();
    const memory = buildStyleDirectionMemory("industrial / utilitarian");
    expect(memory).toContain("Decorative gradient soup");
  });
});
