import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../db";
import { users } from "../db/schema";
import { AppError } from "../lib/errors";
import type { Bindings } from "../types/env";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => { const db = getDB(c.env.DB); return c.json({ success: true, data: await db.select().from(users).all() }); });

app.post("/", async (c) => {
  const body = await c.req.json();
  const db = getDB(c.env.DB);
  try { const res = await db.insert(users).values(body).returning(); return c.json({ success: true, data: res[0] }, 201); }
  catch(e:any){ const m=e?.cause?.message||e?.message||""; if(m.includes("UNIQUE")) throw new AppError(409,"Email exists","CONFLICT"); throw e; }
});

app.get("/:id", async (c) => {
  const db = getDB(c.env.DB);
  const user = await db.select().from(users).where(eq(users.id, Number(c.req.param("id")))).get();
  if(!user) throw new AppError(404,"User not found","NOT_FOUND");
  return c.json({ success: true, data: user });
});

export default app;
