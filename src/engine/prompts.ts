import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GenerateInput } from "./claude.js";

const skillsDir = resolve(fileURLToPath(import.meta.url), "..", "skills");
const frontendDesignSkill = readFileSync(resolve(skillsDir, "frontend-design.md"), "utf8");

export const AESTHETIC_DIRECTIONS = [
  {
    name: "brutally minimal",
    vibe: "type-led, severe negative space, one accent only, zero decoration",
    palette: "off-white #fafaf7 bg + ink #0a0a0a fg + ONE saturated accent (oxblood, mustard, or chartreuse — pick one, NOT cyan/violet)",
    ornament: "thin 1px ruled lines only; no shadows, no gradients, no rounded corners > 4px, no glow",
    bg_style: "flat single color; optional 1px hairline grid overlay at 4-8% opacity",
    typography: "severe grotesk or mono pairings: Archivo + IBM Plex Mono, Work Sans + Fragment Mono, Chivo + Space Mono",
  },
  {
    name: "maximalist chaos",
    vibe: "dense, layered, overlapping cards, expressive type, controlled visual noise",
    palette: "high-saturation clash: hot pink + electric yellow + tomato + ink (NOT blue+purple+cyan)",
    ornament: "marquee/sticker-style tags, hand-stamped numbers, asymmetric paper-cut shapes, hard-edged drop shadows in offset color",
    bg_style: "off-white or cream with grain texture; bright color blocks behind sections",
    typography: "expressive display pairings: Bungee + DM Sans, Ultra + Atkinson Hyperlegible, Bowlby One SC + Public Sans",
  },
  {
    name: "retro-futuristic",
    vibe: "80s/90s computing nostalgia, monospaced display type, hard shadows",
    palette: "deep navy #0b0d2e bg + neon magenta #ff2d95 + electric cyan #00e5ff + cream highlights (NOT purple-blue gradient)",
    ornament: "scanlines, CRT chromatic aberration, pixel borders, terminal-style chrome, grid lines at perspective",
    bg_style: "subtle scanline overlay; horizon-line gradient (navy to magenta at bottom)",
    typography: "retro terminal pairings: VT323 + IBM Plex Mono, Share Tech Mono + Spline Sans Mono, Oxanium + JetBrains Mono",
  },
  {
    name: "organic / natural",
    vibe: "earthy palette, soft serifs, generous breathing room, hand-feel",
    palette: "warm bone #f5efe6 bg + clay/terracotta #c44d2c + moss/olive #6b7c3a + ink (NOT cool-tech blues)",
    ornament: "irregular blob shapes (hand-drawn, NOT smooth radial gradients), botanical line illustrations, watercolor washes",
    bg_style: "warm paper texture; subtle blob-shape washes in clay/moss",
    typography: "warm serif pairings: Fraunces + Source Serif 4, Cormorant Garamond + Nunito Sans, Lora + Assistant",
  },
  {
    name: "luxury / refined",
    vibe: "classic serif display, tight tracking, micro-detail rules",
    palette: "deep cream/parchment #efe9dd bg + ink #1a1813 fg + ONE jewel-tone accent (oxblood #6b1f2a, emerald #1a4d3e, or lapis #1c3d6b — pick one)",
    ornament: "thin gold/black ruled lines, drop caps, micro-rule borders around panels, NO soft glows, NO circles, NO gradients",
    bg_style: "flat parchment or deep ink; optional fine grain texture",
    typography: "luxury editorial pairings: Cormorant Garamond + Barlow, Playfair Display + Manrope, Libre Baskerville + Karla",
  },
  {
    name: "editorial / magazine",
    vibe: "bold display serif, multi-column rhythm, pull-quotes, drop caps, stark hierarchy",
    palette: "newsprint white #fcfcfa + ink + ONE editorial spot color (red #d83232 or yellow #f5c518 or none)",
    ornament: "thick rules between sections, pull-quote frames, drop caps, footnote-style annotations, grotesk meta-labels above headlines",
    bg_style: "flat white; column-rule lines visible",
    typography: "magazine pairings: Abril Fatface + Newsreader, DM Serif Display + Libre Franklin, Spectral + Sora",
  },
  {
    name: "brutalist / raw",
    vibe: "system-honest type (mono ok), exposed grids, hard lines, unstyled-feeling primitives",
    palette: "raw white #ffffff + ink + ONE hazard accent (caution-yellow #fff800 or alert-red #ff3324) — NO gradient, NO soft tone",
    ornament: "exposed border:1px solid black, default-form-element feel, monospace labels, asterisk markers, square corners",
    bg_style: "stark white; visible 8px or 12px grid",
    typography: "raw utility pairings: Saira Condensed + IBM Plex Mono, Oswald + Courier Prime, Archivo Black + Roboto Mono",
  },
  {
    name: "art deco / geometric",
    vibe: "symmetric ornament, condensed display type, bordered panels",
    palette: "champagne #e8dcc4 bg + deep teal #0f3a3e + brass/gold #b8965a + ink",
    ornament: "geometric chevrons, sunburst dividers, double-rule borders, fan-shape decorations, symmetric framing",
    bg_style: "champagne with subtle herringbone or chevron pattern at low opacity",
    typography: "deco pairings: Cinzel + Jost, Cormorant SC + Montserrat, Poiret One + Tenor Sans",
  },
  {
    name: "soft / pastel",
    vibe: "muted candy palette, generous border-radius, friendly rounded sans",
    palette: "warm peach #fce8d8 bg + butter yellow #f9e58c + dusty rose #e8a5b8 + sage #b5c9a3 + soft ink (NOT cyan/purple)",
    ornament: "rounded squircle shapes, gentle drop shadows in tinted color (peach shadow, NOT gray), wavy underlines, soft circle accents (paper-cutout feel, NOT radial gradient blob)",
    bg_style: "warm peach or buttercream; optional pastel blob shapes (hard-edged, paper-cut feel — NOT soft glow)",
    typography: "friendly rounded pairings: Nunito + Fraunces, Baloo 2 + Quicksand, Fredoka + Lora",
  },
  {
    name: "industrial / utilitarian",
    vibe: "high-contrast, stencil/condensed type, info-dense, table-of-data feel, technical labels",
    palette: "concrete grey #e5e5e3 bg + signal-orange #f56e1c or warning-yellow #ffc23a + machine-black #1a1a1a — NO blue, NO purple",
    ornament: "stencil numerals, technical schematic lines, measurement annotations, data-table rules, hazard-stripe headers",
    bg_style: "flat concrete grey; optional blueprint-grid overlay",
    typography: "industrial pairings: Teko + IBM Plex Sans Condensed, Rajdhani + Roboto Mono, Barlow Condensed + Inconsolata",
  },
  {
    name: "japanese minimalism (ma / negative space)",
    vibe: "extreme negative space, asymmetric balance, refined type, single brushstroke accent",
    palette: "bone #f8f5ee bg + sumi ink #1a1a1a + ONE muted accent (persimmon #c3471f or indigo #2d3a5e or moss #4a5d3a)",
    ornament: "thin asymmetric rules, single ink-brush stroke as accent, vertical type runs, generous margins, optional washi-paper texture",
    bg_style: "bone; optional faint vertical line as tatami divider; large empty margins",
    typography: "quiet refined pairings: Noto Serif JP + Noto Sans JP, Shippori Mincho + Zen Kaku Gothic New, Sawarabi Mincho + M PLUS 1",
  },
  {
    name: "swiss/international typographic",
    vibe: "Helvetica-led grid system, mathematical alignment, restrained type scale, no decoration",
    palette: "white + ink + ONE primary accent (red #e30613, yellow #ffd700, or blue #0050b3 — pick one, NOT a gradient)",
    ornament: "12-column grid visible, baseline grid alignment, square corners, no shadows, no curves except in type",
    bg_style: "flat white; mathematical grid",
    typography: "swiss alternatives: Neue Haas-style grotesk via Archivo + IBM Plex Sans, Univers-like via Saira + Public Sans, strict mono accent via IBM Plex Mono",
  },
] as const;

export function pickAestheticDirection(): typeof AESTHETIC_DIRECTIONS[number] {
  const i = Math.floor(Math.random() * AESTHETIC_DIRECTIONS.length);
  return AESTHETIC_DIRECTIONS[i]!;
}

export function buildSystemPrompt(
  viewport: "desktop" | "mobile",
  direction: typeof AESTHETIC_DIRECTIONS[number],
  phase: "full" | "layout" | "animation" = "full",
  styleMemory = "",
): string {
  const width = viewport === "desktop" ? 1440 : 430;
  if (phase === "animation") {
    return `You are a senior frontend motion engineer refining an existing single-file HTML document.

# Animation-only contract (NON-NEGOTIABLE)
- Output exactly one complete HTML document: starts \`<!DOCTYPE html>\`, ends \`</html>\`.
- Preserve the existing layout, content, semantic structure, typography, palette, spacing, and visual direction.
- Modify only CSS and animation-specific JavaScript. Do not rewrite markup except for minimal animation hooks when unavoidable.
- JavaScript is allowed ONLY for the animation layer: a small inline \`<script>\` and GSAP CDN import are acceptable when useful. No unrelated interactivity, network calls, storage, analytics, or app logic.
- Prefer \`transform\` and \`opacity\`; avoid layout-triggering animation.
- Respect \`prefers-reduced-motion\`.
- Keep the animation layer compact: one clear entrance sequence plus meaningful hover/focus affordances is enough.
- No markdown code fences. No preamble, no commentary.

# Existing design context
- Viewport target: ${width}px.
- Aesthetic direction to preserve: ${direction.name}.
- Motion should serve this vibe: ${direction.vibe}.
- Ornament vocabulary to respect: ${direction.ornament}.
${styleMemory ? `\n# Style memory\n${styleMemory}\n` : ""}

# Errors
If you cannot produce valid HTML for the request, output exactly:
<!DOCTYPE html><html><body><!-- error: <reason> --></body></html>`;
  }

  const motionContract = phase === "layout"
    ? "- Produce a strong static layout first. Do NOT add animations, transitions, scripts, Motion, or GSAP in this pass; add stable semantic class hooks so a later animation pass can target the layout cleanly."
    : "- Produce the best static layout and visual direction first. Do NOT add animations, transitions, scripts, Motion, or GSAP unless the user explicitly asks for animation or an animation refinement pass is enabled.";
  const javascriptContract = "- No JavaScript unless the prompt explicitly asks (no `<script>`, no event handlers).";
  return `You are a senior design engineer producing single-file HTML+CSS for a real product surface.

# Output contract (NON-NEGOTIABLE — overrides everything below)
- Exactly one document: starts \`<!DOCTYPE html>\`, ends \`</html>\`.
- All CSS inline in \`<style>\` tag inside \`<head>\`. No external CSS framework imports (no Tailwind/Bootstrap CDN).
- Web fonts via Google Fonts \`<link>\` are allowed and ENCOURAGED — pick fonts that match the aesthetic direction below.
${motionContract}
${javascriptContract}
- No markdown code fences. No preamble, no commentary, no "Here's the HTML:".
- Target viewport: ${width}px. Center long content with a sensible max-width (or break the grid intentionally — see direction).
- Semantic HTML5: header / main / section / article / footer.
- No \`<img>\` placeholders pointing at unsplash/picsum/via.placeholder. Build visuals with CSS, SVG, or omit.

# Aesthetic direction for THIS generation: ${direction.name}
**Vibe:** ${direction.vibe}
**Palette (use these when no tokens provided; if tokens provided, see token-authority section below):** ${direction.palette}
**Typography direction (use when no font tokens are provided):** ${direction.typography}
**Ornament vocabulary:** ${direction.ornament}
**Background treatment:** ${direction.bg_style}

Commit fully to this direction. Do not blend with other directions on the list. The direction is the governing aesthetic decision — every type, color, spacing, ornament, and motion choice should serve it.

${styleMemory ? `# Style memory (post-learned taste database)\n${styleMemory}\n\nUse this memory to emulate strong direction-specific qualities and avoid known slop patterns. Do not copy examples literally; translate their principles into the current product context.\n` : ""}

# Visual idiom anti-slop (HARD — overrides skill defaults)
The following visual idioms are AI-default cliches and FORBIDDEN regardless of direction:
- The "modern AI/SaaS dark-mode" cliche: near-black background + purple-to-cyan gradient + soft radial-gradient glow blobs + glassmorphic floating cards. If tokens push you toward dark + purple + cyan, find a non-blob, non-glow visual character (geometric shapes, grid lines, type as decoration, hard-edged ornament from the direction).
- Soft radial-gradient "shader" circles, blurred glow orbs, ethereal floating shapes used as decoration. Substitute hard-edged geometric shapes, line art, or omit.
- "Glassmorphism with floating elements over noise" pattern. Use solid panels with hard borders or no panels.
- Generic frosted-glass cards with backdrop-filter on dark backgrounds.
- Spacey-tech violet ↔ cyan gradients on text or buttons.
- Uniform 12-16px border-radius on every container (creates the "AI-rounded" look). Vary radius dramatically per direction (0px brutalist, 24-32px soft, asymmetric in maximalist, etc).

# Design knowledge (frontend-design skill)
${frontendDesignSkill}

# Provided-token authority (overrides skill aesthetics)
If \`repo_context\` supplies design tokens (colors, fonts, spacing), those are AUTHORITATIVE choices the user has already made. Use them faithfully and build the chosen aesthetic direction AROUND them, not against them. The skill's "avoid Inter" guidance applies only when no font tokens are provided. When tokens ARE provided:
- Use the specified primary/accent/background colors as the dominant palette.
- Use the specified fonts as the actual typeface (load via Google Fonts \`<link>\` if available there).
- Use the specified spacing tokens as the spacing system; do not invent off-token values.
- Express the aesthetic direction through type pairing, layout, motion, and visual ornament — NOT by substituting tokens.

# Component-name fidelity
If \`repo_context.components\` lists component names, mirror those names as CSS class slugs (e.g., \`PricingCard\` → \`.pricing-card\`). Don't invent novel components when listed ones cover the surface.

# Errors
If you cannot produce valid HTML for the request, output exactly:
<!DOCTYPE html><html><body><!-- error: <reason> --></body></html>`;
}

export function buildUserPrompt(input: GenerateInput): string {
  if (input.phase === "animation" && input.priorHtml !== undefined && input.feedback !== undefined) {
    return `## Prior HTML
\`\`\`html
${input.priorHtml}
\`\`\`

## Animation feedback
${input.feedback}

Return the revised complete HTML document.`;
  }

  const repoContextStr =
    typeof input.repoContext === "string"
      ? input.repoContext
      : JSON.stringify(input.repoContext, null, 2);

  const modeSection =
    input.mode !== "none" && input.url
      ? `${input.mode}\nReference URL: ${input.url}`
      : input.mode;

  let prompt = `## User prompt\n${input.prompt}\n\n## Repo context\n${repoContextStr}\n\n## Mode\n${modeSection}`;

  if (input.priorHtml !== undefined && input.feedback !== undefined) {
    prompt += `\n\n## Prior HTML\n\`\`\`html\n${input.priorHtml}\n\`\`\`\n\n## Feedback\n${input.feedback}\n\nProduce a revised single HTML document applying the feedback.`;
  }

  return prompt;
}
