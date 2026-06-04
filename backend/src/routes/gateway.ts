import { Hono } from "hono";
import { tempAuth } from "../middleware/tempAuth";
import { AppError } from "../lib/errors";
import type { Bindings } from "../types/env";

const app = new Hono<{ Bindings: Bindings }>();
app.use(tempAuth);

app.post("/exec", async (c) => {
  const { sql, params = [] } = await c.req.json();
  if(!sql || typeof sql !== "string") throw new AppError(400,"sql required");
  const db = c.env.DB;
  const stmt = db.prepare(sql).bind(...params);
  const trimmed = sql.trim().toLowerCase();
  const isRead = ["select","pragma","with","explain"].some(p => trimmed.startsWith(p));
  try {
    if(isRead){ const res = await stmt.all(); return c.json({ success:true, results:res.results, meta:res.meta }); }
    else { const res = await stmt.run(); return c.json({ success:true, meta:res.meta }); }
  } catch(e:any){ throw new AppError(400,e.message,"SQL_ERROR"); }
});

app.post("/batch", async (c) => {
  const { statements } = await c.req.json();
  if(!Array.isArray(statements)) throw new AppError(400,"statements array required");
  const db = c.env.DB;
  const batch = statements.map((s:any) => typeof s === "string" ? db.prepare(s) : db.prepare(s.sql).bind(...(s.params||[])));
  try { const results = await db.batch(batch); return c.json({ success:true, count:results.length, results }); }
  catch(e:any){ throw new AppError(400,e.message,"SQL_ERROR"); }
});

app.get("/tables", async (c) => {
  const res = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  return c.json({ success:true, tables:res.results });
});

app.get("/tables/:name", async (c) => {
  const name = c.req.param("name");
  const db = c.env.DB;
  const cols = await db.prepare(`PRAGMA table_info(${name})`).all();
  const idx = await db.prepare(`PRAGMA index_list(${name})`).all();
  return c.json({ success:true, columns:cols.results, indexes:idx.results });
});

export default app;
