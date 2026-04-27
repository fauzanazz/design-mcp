import { describe, it, expect } from "bun:test";
import { parseRefineOutput, refineRepoContext, RefineParseError } from "../src/engine/refine-tokens.js";

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;

const SLOP_TOKENS = {
  primary: "#a78bfa",
  accent: "#22d3ee",
  bg: "#09090b",
  fg: "#fafafa",
  font: "Inter",
};

describe("parseRefineOutput", () => {
  it("parses slop response with refined object", () => {
    const raw = JSON.stringify({
      refined: { primary: "#8B2635", accent: "#D4AF37", bg: "#F5F0E8", fg: "#1a1a1a", font: "Cormorant Garamond" },
      reason: "Detected modern AI/SaaS dark mode cliche; replaced with luxury/refined family.",
    });
    const result = parseRefineOutput(raw);
    expect(result.refined).not.toBeNull();
    expect(typeof result.reason).toBe("string");
  });

  it("parses non-slop response with null refined", () => {
    const raw = JSON.stringify({ refined: null, reason: "Palette uses terracotta and bone; already non-slop." });
    const result = parseRefineOutput(raw);
    expect(result.refined).toBeNull();
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("strips json code fences before parsing", () => {
    const inner = JSON.stringify({ refined: null, reason: "Already distinctive." });
    const raw = "```json\n" + inner + "\n```";
    const result = parseRefineOutput(raw);
    expect(result.refined).toBeNull();
  });

  it("throws RefineParseError on invalid JSON", () => {
    expect(() => parseRefineOutput("not json at all")).toThrow(RefineParseError);
  });

  it("throws RefineParseError when shape is missing required keys", () => {
    expect(() => parseRefineOutput(JSON.stringify({ something: "else" }))).toThrow(RefineParseError);
  });

  it("throws RefineParseError when reason is not a string", () => {
    expect(() => parseRefineOutput(JSON.stringify({ refined: null, reason: 42 }))).toThrow(RefineParseError);
  });
});

describe("refineRepoContext (smoke)", () => {
  it(
    "refines slop-class palette and explains why",
    async () => {
      if (!HAS_KEY) return;

      const result = await refineRepoContext(SLOP_TOKENS);

      expect(result.refined).not.toBeNull();
      expect((result.refined as Record<string, string>).bg).not.toBe("#09090b");
      expect(result.reason.toLowerCase()).toMatch(/slop|cliche|dark mode|ai.saas|violet|purple|cyan/);
      expect(result.costUsd).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);

      console.log("refined:", JSON.stringify(result.refined, null, 2));
      console.log("reason:", result.reason);
      console.log("cost:", result.costUsd);
      console.log("duration:", result.durationMs, "ms");
    },
    60_000
  );

  it(
    "returns null refined for non-slop input",
    async () => {
      if (!HAS_KEY) return;

      const nonSlop = { primary: "#8B2635", accent: "#D4AF37", bg: "#F5F0E8", fg: "#1a1a1a" };
      const result = await refineRepoContext(nonSlop);

      expect(result.refined).toBeNull();
      expect(result.reason.length).toBeGreaterThan(0);
    },
    60_000
  );
});
