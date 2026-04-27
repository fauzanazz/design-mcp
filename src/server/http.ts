import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { checkApiKey } from "./auth.js";
import { logger } from "../util/log.js";
import { createMcpServer } from "./mcp.js";
import { config } from "../config.js";

type Session = {
  transport: WebStandardStreamableHTTPServerTransport;
  touchedAt: number;
};

const sessions = new Map<string, Session>();

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,x-api-key,mcp-session-id",
  "access-control-expose-headers": "mcp-session-id",
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...corsHeaders, ...init.headers },
  });
}

function text(body: string, init: ResponseInit = {}): Response {
  return new Response(body, { ...init, headers: { ...corsHeaders, ...init.headers } });
}

function cleanupSessions(now = Date.now()): void {
  for (const [sessionId, session] of sessions) {
    if (now - session.touchedAt > config.sessionTtlMs) {
      sessions.delete(sessionId);
      session.transport.close().catch((err: Error) => logger.warn("session close failed", { sessionId, error: err.message }));
      logger.info("session expired", { sessionId });
    }
  }
}

function makeTransport(): WebStandardStreamableHTTPServerTransport {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport, touchedAt: Date.now() });
      logger.info("session opened", { sessionId });
    },
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId);
      logger.info("session closed", { sessionId });
    },
  });

  const server = createMcpServer();
  server.connect(transport).catch((err: Error) => logger.error("connect error", err.message));
  return transport;
}

function hasValidLength(req: Request): boolean {
  const length = req.headers.get("content-length");
  return !length || Number(length) <= config.maxRequestBytes;
}

export function buildFetch() {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();

    try {
      cleanupSessions();

      if (req.method === "OPTIONS") return text("", { status: 204 });

      const url = new URL(req.url);
      if (url.pathname === "/healthz") return json({ ok: true, request_id: requestId });
      if (url.pathname === "/readyz") {
        return json({ ok: true, sessions: sessions.size, request_id: requestId });
      }

      if (url.pathname !== "/mcp") return json({ error: "not found", request_id: requestId }, { status: 404 });
      if (!["GET", "POST", "DELETE"].includes(req.method)) {
        return json({ error: "method not allowed", request_id: requestId }, { status: 405 });
      }
      if (!hasValidLength(req)) return json({ error: "request too large", request_id: requestId }, { status: 413 });
      if (!checkApiKey(req)) return json({ error: "unauthorized", request_id: requestId }, { status: 401 });

      const sessionId = req.headers.get("mcp-session-id");

      if (sessionId) {
        const existing = sessions.get(sessionId);
        if (!existing) return json({ error: "session not found", request_id: requestId }, { status: 404 });
        existing.touchedAt = Date.now();
        return existing.transport.handleRequest(req);
      }

      if (req.method !== "POST") {
        return json({ error: "missing mcp-session-id", request_id: requestId }, { status: 400 });
      }

      const transport = makeTransport();
      return transport.handleRequest(req);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("request failed", { requestId, message });
      return json({ error: "internal server error", request_id: requestId }, { status: 500 });
    } finally {
      logger.info("request complete", { requestId, method: req.method, durationMs: Date.now() - startedAt });
    }
  };
}
