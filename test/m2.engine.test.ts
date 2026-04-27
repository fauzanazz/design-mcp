/**
 * Engine smoke test — requires a real ANTHROPIC_API_KEY.
 *
 * Run with:
 *   ANTHROPIC_API_KEY=sk-... bun test test/m2.engine.test.ts
 *
 * Skipped automatically when ANTHROPIC_API_KEY is not set.
 */
import { describe, it, expect } from "bun:test";
import { generateDesign } from "../src/engine/claude.js";

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;

describe("generateDesign (smoke)", () => {
  it(
    "returns valid HTML for a simple prompt",
    async () => {
      if (!HAS_KEY) return;

      const result = await generateDesign({
        prompt: "red landing page",
        repoContext: "n/a",
        viewport: "desktop",
        mode: "none",
      });

      expect(result.html.toLowerCase()).toMatch(/^<!doctype/);
      expect(result.html.length).toBeGreaterThan(500);
      console.log("html length:", result.html.length);
      console.log("first 200 chars:", result.html.slice(0, 200));
      console.log("cost:", result.costUsd);
      console.log("duration:", result.durationMs, "ms");
    },
    60_000
  );
});
