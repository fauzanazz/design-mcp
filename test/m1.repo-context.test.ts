import { describe, it, expect } from "bun:test";
import { repoContextSchema } from "../src/tools/schemas.js";

describe("repoContextSchema", () => {
  it("accepts a plain string", () => {
    expect(() => repoContextSchema.parse("n/a")).not.toThrow();
  });

  it("accepts a full typed object", () => {
    const input = {
      summary: "My design system",
      design_tokens: { colors: { primary: "#000" } },
      framework: "Next",
    };
    const result = repoContextSchema.parse(input);
    expect((result as typeof input).framework).toBe("Next");
  });

  it("accepts unknown extra keys (passthrough)", () => {
    const input = { summary: "x", unknownProp: true };
    const result = repoContextSchema.parse(input) as typeof input;
    expect(result.unknownProp).toBe(true);
  });

  it("rejects a number (neither string nor object)", () => {
    expect(() => repoContextSchema.parse(123)).toThrow();
  });
});
