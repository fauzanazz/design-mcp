import { describe, it, expect } from "bun:test";
import { extractHtml, EngineOutputInvalidError } from "../src/engine/extract-html.js";

const MINIMAL = "<!DOCTYPE html><html><head></head><body><p>hello world, this is test content for length</p></body></html>";

describe("extractHtml", () => {
  it("returns plain HTML doc unchanged", () => {
    expect(extractHtml(MINIMAL)).toBe(MINIMAL);
  });

  it("strips ```html code fence", () => {
    const fenced = "```html\n" + MINIMAL + "\n```";
    expect(extractHtml(fenced)).toBe(MINIMAL);
  });

  it("strips plain ``` code fence", () => {
    const fenced = "```\n" + MINIMAL + "\n```";
    expect(extractHtml(fenced)).toBe(MINIMAL);
  });

  it("strips preamble before DOCTYPE", () => {
    const withPreamble = "Here's the HTML:\n\n" + MINIMAL;
    expect(extractHtml(withPreamble)).toBe(MINIMAL);
  });

  it("strips trailing prose after </html>", () => {
    const withTrail = MINIMAL + "\n\nLet me know if you'd like changes.";
    expect(extractHtml(withTrail)).toBe(MINIMAL);
  });

  it("throws EngineOutputInvalidError for plain text with no DOCTYPE", () => {
    expect(() => extractHtml("I cannot help with this request.")).toThrow(EngineOutputInvalidError);
  });

  it("throws EngineOutputInvalidError for HTML missing </html>", () => {
    expect(() => extractHtml("<!DOCTYPE html><html><body>truncated")).toThrow(EngineOutputInvalidError);
  });
});
