import { query } from "@anthropic-ai/claude-agent-sdk";
import { tmpdir } from "node:os";

export interface RefineResult {
  refined: object | null;
  reason: string;
  costUsd: number;
  durationMs: number;
}

export class RefineParseError extends Error {
  constructor(raw: string) {
    super(`refinery output could not be parsed: ${raw.slice(0, 200)}`);
    this.name = "RefineParseError";
  }
}

const DISALLOWED_TOOLS = [
  "Read", "Write", "Edit", "Bash", "Glob", "Grep",
  "WebSearch", "WebFetch", "Task", "TodoWrite", "NotebookEdit",
];

const SYSTEM_PROMPT = `You are a design-token refiner. Given user-provided design tokens (colors, possibly fonts/spacing), detect whether the palette is "AI-slop-class" and propose non-slop alternatives that PRESERVE user intent.

# Slop palette detection
A palette is slop-class if it matches one of these AI-cliche patterns:
- Modern AI/SaaS dark mode: near-black bg (#0X0X0X) + violet/purple primary (#7-9X-X-X-FX range, hsl ~260-280) + cyan/teal accent (hsl ~180-200)
- Generic tech: indigo/blue primary + violet accent + white/grey bg
- "Vibrant SaaS": purple-pink gradient hero + grey body
- Ocean tech: teal + dark blue + grey
- Stripe-imitation: indigo primary + violet ramps + white bg
- Default Tailwind palette unchanged (slate/zinc/neutral + blue/violet/purple)

# Refinement rules (when palette IS slop-class)
- PRESERVE color RELATIONSHIPS and SEMANTIC ROLES: primary stays "primary" (the brand-identity color), accent stays "accent" (the highlight color), bg stays "bg" (page background), etc. Don't swap roles.
- PRESERVE CONTRAST level (light-on-dark, dark-on-light, etc).
- PRESERVE the EMOTIONAL register (premium → still premium, playful → still playful, technical → still technical) but expressed in non-slop palette.
- Pick ONE replacement family per generation, committed and coherent. Possible families:
  - Luxury/refined: deep cream/parchment + ink + jewel accent (oxblood / emerald / lapis)
  - Editorial: newsprint white + ink + single editorial spot color (red / yellow / forest)
  - Earthy/organic: warm bone + clay/terracotta + moss/olive + ink
  - Industrial: concrete grey + signal-orange or warning-yellow + machine-black
  - Retro-futuristic: deep navy + neon magenta + electric cyan + cream (still escape generic tech)
  - Japanese minimalism: bone + sumi ink + persimmon or indigo or moss
  - Art deco: champagne + deep teal + brass + ink
  - Soft pastel: warm peach + butter yellow + dusty rose + soft ink
  - Brutalist: stark white + ink + ONE hazard color (caution-yellow / alert-red)
- Return both colors and font suggestions if user provided slop fonts (Inter/Roboto/system-default → suggest distinctive serif or unusual sans pairing matching the family).
- KEEP user's component names and spacing tokens UNTOUCHED — only colors and fonts get refined.

# Output contract (HARD)
Output ONLY valid JSON. No prose, no markdown fences.

If palette is slop-class:
{"refined": <refined-tokens-object-with-same-shape-as-input>, "reason": "<one-sentence explanation of which slop pattern was detected and which family was chosen>"}

If palette is NOT slop-class:
{"refined": null, "reason": "<one-sentence explanation of why it's already non-slop>"}

The "refined" object MUST have the same key shape as the input (preserve all keys; only mutate values where appropriate). If input was a string ("n/a" or similar), output {"refined": null, "reason": "no tokens provided"}.`;

export function parseRefineOutput(raw: string): Pick<RefineResult, "refined" | "reason"> {
  const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new RefineParseError(raw);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("refined" in parsed) ||
    !("reason" in parsed) ||
    typeof (parsed as Record<string, unknown>).reason !== "string"
  ) {
    throw new RefineParseError(raw);
  }

  const { refined, reason } = parsed as { refined: unknown; reason: string };
  return {
    refined: refined !== null && typeof refined === "object" ? (refined as object) : null,
    reason,
  };
}

export async function refineRepoContext(input: string | object): Promise<RefineResult> {
  const userPrompt = typeof input === "string" ? input : JSON.stringify(input, null, 2);
  const t0 = Date.now();

  const messages = query({
    prompt: userPrompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      tools: [],
      disallowedTools: DISALLOWED_TOOLS,
      settingSources: [],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
      model: "claude-haiku-4-5-20251001",
      cwd: tmpdir(),
      persistSession: false,
      thinking: { type: "disabled" },
    },
  });

  for await (const msg of messages) {
    if (msg.type === "result" && msg.subtype === "success") {
      const { refined, reason } = parseRefineOutput(msg.result);
      return {
        refined,
        reason,
        costUsd: msg.total_cost_usd,
        durationMs: Date.now() - t0,
      };
    }
  }

  throw new RefineParseError("query ended without a success result");
}
