import { describe, it, expect } from "bun:test";
import { buildFetch } from "../src/server/http.js";

const fetchHandler = buildFetch();

describe("production http shell", () => {
  it("serves health and readiness probes", async () => {
    const health = await fetchHandler(new Request("http://localhost/healthz"));
    expect(health.status).toBe(200);
    expect(await health.json()).toHaveProperty("ok", true);

    const ready = await fetchHandler(new Request("http://localhost/readyz"));
    expect(ready.status).toBe(200);
    expect(await ready.json()).toHaveProperty("sessions");
  });

  it("rejects unknown routes and invalid MCP access", async () => {
    const missing = await fetchHandler(new Request("http://localhost/nope"));
    expect(missing.status).toBe(404);

    const noSession = await fetchHandler(new Request("http://localhost/mcp", { method: "GET" }));
    expect(noSession.status).toBe(400);
    expect(await noSession.json()).toHaveProperty("error", "missing mcp-session-id");
  });

  it("rejects oversized requests before transport handling", async () => {
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "content-length": String(60 * 1024 * 1024) },
      body: "{}",
    });

    const res = await fetchHandler(req);
    expect(res.status).toBe(413);
  });
});
