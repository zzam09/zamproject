import { createMiddleware } from "hono/factory";
import { ConfigService } from "../services/config";
import { AppError } from "../lib/errors";

export const adminAuth = createMiddleware(async (c, next) => {
  const key = c.req.header("x-admin-key");
  if (!key) throw new AppError(401, "Missing x-admin-key", "UNAUTHORIZED");
  if (key !== await new ConfigService(c.env.DB).getOrDefault("admin_key")) throw new AppError(401, "Invalid admin key", "UNAUTHORIZED");
  await next();
});
