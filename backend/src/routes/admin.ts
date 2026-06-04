import { Hono } from "hono";
import { adminAuth } from "../middleware/adminAuth";
import { ConfigService } from "../services/config";
import { AppError } from "../lib/errors";
import type { Bindings } from "../types/env";

const app = new Hono<{ Bindings: Bindings }>();
app.use(adminAuth);

app.get("/health", async (c) => c.json({ success: true }));

app.get("/config", async (c) => {
  const all = await new ConfigService(c.env.DB).getAll();
  const masked: Record<string,string> = {};
  for(const [k,v] of Object.entries(all)) masked[k] = (k.includes("key") && v.length>8) ? v.slice(0,4)+"****"+v.slice(-4) : v;
  return c.json({ success: true, data: masked });
});

app.post("/config", async (c) => {
  const { key, value } = await c.req.json();
  if(!key || value===undefined) throw new AppError(400,"key and value required");
  await new ConfigService(c.env.DB).set(key, String(value));
  return c.json({ success: true });
});

app.post("/config/regenerate/:key", async (c) => {
  const key = c.req.param("key");
  const newVal = crypto.randomUUID();
  await new ConfigService(c.env.DB).set(key, newVal);
  return c.json({ success: true, value: newVal });
});

export default app;
