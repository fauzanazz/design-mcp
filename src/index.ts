import { config } from "./config.js";
import { buildFetch } from "./server/http.js";
import { logger } from "./util/log.js";

const fetchHandler = buildFetch();

const server = Bun.serve({
  port: config.port,
  fetch: fetchHandler,
});

logger.info(`design-mcp listening :${config.port}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    logger.info("shutting down", { signal });
    server.stop(true);
    process.exit(0);
  });
}
