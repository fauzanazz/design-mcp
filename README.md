# design-mcp

Local MCP server for generating opinionated single-file UI designs, refining them, adding optional animation passes, and teaching the model which styles are amazing vs slop.

![Example generated output](assets/example-output.svg)

## Highlights

- `generate_design` creates HTML/CSS product surfaces from a prompt + repo context.
- `animate_after_layout` runs a second animation-only pass after the static layout is done.
- Animation pass can add compact GSAP/JS only for motion; default generation stays static and safe.
- `rate_style_direction` lets users label results as `amazing` or `slop` so future generations learn taste.
- Runs through both HTTP MCP (`src/index.ts`) and Droid/Claude stdio MCP (`src/stdio.ts`).

## Install

```bash
bun install
```

## Dev

```bash
cp .env.example .env
bun dev
```

## Test

```bash
bun run typecheck
bun test
```

## Run HTTP MCP

```bash
bun start
# Listens on :3333 by default
```

## Run stdio MCP

Use this from `.mcp.json`:

```json
{
  "mcpServers": {
    "design-mcp": {
      "command": "bun",
      "args": ["/absolute/path/to/design-mcp/src/stdio.ts"]
    }
  }
}
```

## Inspect

```bash
bun inspect
# Opens MCP Inspector pointed at http://localhost:3333/mcp
```

## Auth

Pass `x-api-key: <DESIGN_MCP_API_KEY>` header on all requests. Unset key disables auth check (dev convenience).

## Transport

Uses `WebStandardStreamableHTTPServerTransport` (Bun-native Web Standard APIs) via `Bun.serve`. No Node.js http adapter needed.

## Core tools

- `generate_design`
- `refine_design`
- `rate_style_direction`
- `get_canvas`
- `list_canvases`
- `extract_canvas_design`

## Enable real engine

By default `generate_design` and `refine_design` return canned HTML so tests pass without credentials. To use the real Claude engine:

```bash
export DESIGN_MCP_USE_ENGINE=1
export DESIGN_MCP_ENGINE_PROVIDER=claude-binary
```

Optional tuning:

```bash
export DESIGN_MCP_MODEL=claude-sonnet-4-6
export DESIGN_MCP_ANIMATION_MODEL=haiku
export DESIGN_MCP_MAX_CONCURRENCY=4
export DESIGN_MCP_WRITE_ARTIFACTS=1
```

Engine smoke test (requires API key):

```bash
ANTHROPIC_API_KEY=sk-ant-... bun test test/m2.engine.test.ts
```

## Token refinery

When `DESIGN_MCP_REFINE_TOKENS=1` is set, a haiku-based preprocessor runs before main generation and detects slop-class palettes (e.g. the `#a78bfa` violet + `#22d3ee` cyan + `#09090b` near-black "modern AI/SaaS dark mode" cliche). If detected, the refinery proposes a family-coherent alternative that preserves color relationships, semantic roles, and contrast while escaping the tech-SaaS idiom.

- Adds ~$0.01 per call and ~5-15s latency (haiku model)
- Only colors and fonts are mutated; component names and spacing tokens are untouched
- The MCP response includes `repo_context_refined` (the replacement, or null if no refinement needed) and `refinement_reason`

```bash
export DESIGN_MCP_USE_ENGINE=1
export DESIGN_MCP_REFINE_TOKENS=1
export ANTHROPIC_API_KEY=sk-ant-...
```

Refinery unit tests (no API key needed):

```bash
bun test test/m2.refine-tokens.test.ts
```
