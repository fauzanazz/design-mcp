function parseBool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (["1", "true", "yes"].includes(value.toLowerCase())) return true;
  if (["0", "false", "no"].includes(value.toLowerCase())) return false;
  throw new Error(`${name} must be a boolean`);
}

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const useEngine = parseBool("DESIGN_MCP_USE_ENGINE");
const apiKey = process.env.DESIGN_MCP_API_KEY ?? "";
const engineProvider = process.env.DESIGN_MCP_ENGINE_PROVIDER ?? "sdk";

if (nodeEnv === "production" && !apiKey) {
  throw new Error("DESIGN_MCP_API_KEY is required in production");
}

if (useEngine && engineProvider === "sdk" && !process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required when DESIGN_MCP_USE_ENGINE is enabled");
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: parseIntEnv("PORT", 3333, 1, 65535),
  apiKey,
  dbPath: process.env.DESIGN_MCP_DB_PATH ?? "./data/design-mcp.db",
  useEngine,
  engineProvider,
  claudeBinary: process.env.DESIGN_MCP_CLAUDE_BINARY ?? "claude",
  model: process.env.DESIGN_MCP_MODEL ?? "claude-sonnet-4-6",
  animationModel: process.env.DESIGN_MCP_ANIMATION_MODEL ?? process.env.DESIGN_MCP_MODEL ?? "haiku",
  maxConcurrency: parseIntEnv("DESIGN_MCP_MAX_CONCURRENCY", 2, 1, 16),
  writeArtifacts: parseBool("DESIGN_MCP_WRITE_ARTIFACTS"),
  artifactBasePath: process.env.DESIGN_MCP_ARTIFACT_BASE_PATH ?? process.cwd(),
  refineTokens: parseBool("DESIGN_MCP_REFINE_TOKENS"),
  sessionTtlMs: parseIntEnv("DESIGN_MCP_SESSION_TTL_MS", 30 * 60 * 1000, 60_000, 24 * 60 * 60 * 1000),
  maxRequestBytes: parseIntEnv("DESIGN_MCP_MAX_REQUEST_BYTES", 5 * 1024 * 1024, 1024, 50 * 1024 * 1024),
};
