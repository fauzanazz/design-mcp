# design-mcp

MCP server that clones the AIDesigner MCP architectural shell.

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
bun test
```

## Run

```bash
bun start
# Listens on :3333 by default
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

## Milestones

- M0: 10 tools, canned responses, no persistence
- M1: SQLite run store, real RepoContextObject shape
- M2 (current): Claude SDK invocation wired to generate/refine tools

## M2: enabling real engine

By default `generate_design` and `refine_design` return canned HTML so tests pass without credentials. To use the real Claude engine:

```bash
export DESIGN_MCP_USE_ENGINE=1
export ANTHROPIC_API_KEY=sk-ant-...
```

Optional tuning:

```bash
export DESIGN_MCP_MODEL=claude-opus-4-7          # higher fidelity (default: claude-haiku-4-5-20251001)
export DESIGN_MCP_MAX_CONCURRENCY=4              # parallel engine calls (default: 2)
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
