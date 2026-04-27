/*
 * query() from @anthropic-ai/claude-agent-sdk spawns a Claude Code subprocess
 * and returns an AsyncGenerator<SDKMessage>. We need only a single turn of
 * pure text generation, so:
 *
 * - tools: [] + disallowedTools: [...all built-ins] — no tool loop, just text
 * - mcpServers not set (defaults to nothing from the SDK) — don't pull user's MCP servers
 * - settingSources: [] — don't load ~/.claude/ or .claude/ from cwd; prevents
 *   user's local CLAUDE.md, hooks, and skills from bleeding into generation
 * - permissionMode: "bypassPermissions" + allowDangerouslySkipPermissions: true
 *   required pair; no-op since tools are disabled, but needed to suppress
 *   interactive prompts if the subprocess somehow tries
 * - maxTurns: 1 — one shot, no agent loop
 * - model: env-configurable, haiku default for cheap dev iterations
 * - cwd: os.tmpdir() — neutral working dir, no project settings loaded
 * - persistSession: false — ephemeral, no session written to ~/.claude/projects/
 *
 * Result is in SDKResultSuccess.result (string), with cost and duration on the
 * same message.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { tmpdir } from "node:os";
import { buildSystemPrompt, buildUserPrompt, pickAestheticDirection } from "./prompts.js";
import { extractHtml, EngineOutputInvalidError } from "./extract-html.js";
import { config } from "../config.js";
import { buildStyleDirectionMemory } from "../store/style-directions.js";

export type { EngineOutputInvalidError };

export interface GenerateInput {
  prompt: string;
  repoContext: string | object;
  viewport: "desktop" | "mobile";
  mode: "none" | "inspire" | "clone" | "enhance";
  url?: string;
  priorHtml?: string;
  feedback?: string;
  phase?: "full" | "layout" | "animation";
  aestheticDirection?: ReturnType<typeof pickAestheticDirection>;
  model?: string;
  styleMemory?: string;
}

export interface GenerateOutput {
  html: string;
  costUsd: number;
  durationMs: number;
  model: string;
  direction: string;
}

const DISALLOWED_TOOLS = [
  "Read", "Write", "Edit", "Bash", "Glob", "Grep",
  "WebSearch", "WebFetch", "Task", "TodoWrite", "NotebookEdit",
];

const RETRY_SUFFIX = "\n\nIMPORTANT: Output ONLY the HTML document. No prose, no fences, nothing else.";

type ThinkingMode = "disabled" | "adaptive" | "enabled";

function thinkingConfig(): { type: "disabled" } | { type: "adaptive" } | { type: "enabled"; budgetTokens: number } {
  const mode = (process.env.DESIGN_MCP_THINKING ?? "disabled") as ThinkingMode;
  if (mode === "adaptive") return { type: "adaptive" };
  if (mode === "enabled") {
    const budget = Number(process.env.DESIGN_MCP_THINKING_BUDGET ?? 1024);
    return { type: "enabled", budgetTokens: budget };
  }
  return { type: "disabled" };
}

async function runQuery(
  systemPrompt: string,
  userPrompt: string,
  direction: string,
  model: string,
): Promise<GenerateOutput> {
  const messages = query({
    prompt: userPrompt,
    options: {
      systemPrompt,
      tools: [],
      disallowedTools: DISALLOWED_TOOLS,
      settingSources: [],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
      model,
      cwd: tmpdir(),
      persistSession: false,
      thinking: thinkingConfig(),
    },
  });

  for await (const msg of messages) {
    if (msg.type === "result" && msg.subtype === "success") {
      const html = extractHtml(msg.result);
      return {
        html,
        costUsd: msg.total_cost_usd,
        durationMs: msg.duration_ms,
        model,
        direction,
      };
    }
  }

  throw new EngineOutputInvalidError("query ended without a success result");
}

async function runClaudeBinary(
  systemPrompt: string,
  userPrompt: string,
  direction: string,
  model: string,
): Promise<GenerateOutput> {
  const startedAt = Date.now();
  const proc = Bun.spawn({
    cmd: [
      config.claudeBinary,
      "-p",
      "--output-format",
      "json",
      "--no-session-persistence",
      "--model",
      model,
      "--tools",
      "",
      "--permission-mode",
      "bypassPermissions",
      "--dangerously-skip-permissions",
      "--system-prompt",
      systemPrompt,
      userPrompt,
    ],
    cwd: tmpdir(),
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`claude binary failed (${exitCode}): ${stderr || stdout}`);
  }

  const payload = JSON.parse(stdout) as {
    subtype?: string;
    result?: string;
    total_cost_usd?: number;
    duration_ms?: number;
  };
  if (payload.subtype !== "success" || typeof payload.result !== "string") {
    throw new EngineOutputInvalidError("claude binary ended without a success result");
  }

  return {
    html: extractHtml(payload.result),
    costUsd: payload.total_cost_usd ?? 0,
    durationMs: payload.duration_ms ?? Date.now() - startedAt,
    model,
    direction,
  };
}

function runEngine(systemPrompt: string, userPrompt: string, direction: string, model: string): Promise<GenerateOutput> {
  if (config.engineProvider === "claude-binary") {
    return runClaudeBinary(systemPrompt, userPrompt, direction, model);
  }
  return runQuery(systemPrompt, userPrompt, direction, model);
}

export async function generateDesign(input: GenerateInput): Promise<GenerateOutput> {
  const direction = input.aestheticDirection ?? pickAestheticDirection();
  const styleMemory = input.styleMemory ?? buildStyleDirectionMemory(direction.name);
  const systemPrompt = buildSystemPrompt(input.viewport, direction, input.phase ?? "full", styleMemory);
  const userPrompt = buildUserPrompt(input);
  const model = input.model ?? (input.phase === "animation" ? config.animationModel : config.model);

  try {
    return await runEngine(systemPrompt, userPrompt, direction.name, model);
  } catch (err) {
    if (err instanceof EngineOutputInvalidError) {
      return runEngine(systemPrompt + RETRY_SUFFIX, userPrompt, direction.name, model);
    }
    throw err;
  }
}
