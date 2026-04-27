import { config } from "../config.js";

export function checkApiKey(req: Request): boolean {
  if (!config.apiKey) return !config.isProduction;
  return req.headers.get("x-api-key") === config.apiKey;
}
