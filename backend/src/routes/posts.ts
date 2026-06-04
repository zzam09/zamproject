import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../db";
import { posts } from "../db/schema";
import { AppError } from "../lib/errors";
import type { Bindings } from "../types/env";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => { const db = getDB(c.env.DB); return c.json({ success: true, data: await db.select().from(posts).all() }); });

app.post("/", async (c) => {
  const body = await c.req.json();
  const db = getDB(c.env.DB);
  const res = await db.insert(posts).values(body).returning();
  return c.json({ success: true, data: res[0] }, 201);
});

app.get("/:id", async (c) => {
  const db = getDB(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, Number(c.req.param("id")))).get();
  if(!post) throw new AppError(404,"Post not found","NOT_FOUND");
  return c.json({ success: true, data: post });
});

export default app;
