type Level = "info" | "warn" | "error";

const log = (level: Level, msg: string, meta?: unknown) => {
  const entry = {
    level,
    msg,
    time: new Date().toISOString(),
    ...(meta && typeof meta === "object" ? { meta } : meta !== undefined ? { meta } : {}),
  };
  console.log(JSON.stringify(entry));
};

export const logger = {
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
