import { createMiddleware } from "hono/factory";
import { ConfigService } from "../services/config";
import { AppError } from "../lib/errors";

export const tempAuth = createMiddleware(async (c, next) => {
  const cfg = new ConfigService(c.env.DB);
  if (!await cfg.getBool("gateway_enabled")) throw new AppError(403, "Gateway is disabled", "FORBIDDEN");
  const key = c.req.header("x-temp-key");
  if (!key) throw new AppError(401, "Missing x-temp-key", "UNAUTHORIZED");
  if (key !== await cfg.getOrDefault("temp_gateway_key")) throw new AppError(401, "Invalid temp key", "UNAUTHORIZED");
  await next();
});
