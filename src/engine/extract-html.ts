export class EngineOutputInvalidError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message);
    this.name = "EngineOutputInvalidError";
  }
}

const CODE_FENCE_RE = /^```(?:html)?\n([\s\S]*)\n```$/;

export function extractHtml(raw: string): string {
  let text = raw.trim();

  const fenceMatch = CODE_FENCE_RE.exec(text);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const doctypeIdx = text.search(/<!doctype/i);
  const closeIdx = text.search(/<\/html>/i);

  if (doctypeIdx === -1 || closeIdx === -1) {
    throw new EngineOutputInvalidError(
      "no DOCTYPE found",
      text.slice(0, 500)
    );
  }

  const endIdx = closeIdx + "</html>".length;
  const result = text.slice(doctypeIdx, endIdx);

  if (result.length < 100 || !/<html/i.test(result) || !/<\/html>/i.test(result)) {
    throw new EngineOutputInvalidError(
      "extracted HTML failed sanity check",
      result.slice(0, 500)
    );
  }

  return result;
}
