import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

const defaults: Record<string, string> = {
  gateway_enabled: "true",
  temp_gateway_key: crypto.randomUUID(),
  admin_key: "admin-change-me-now",
};

export class ConfigService {
  db;
  constructor(d1: D1Database) { this.db = drizzle(d1, { schema }); }
  
  async get(key: string): Promise<string | undefined> {
    const row = await this.db.select().from(schema.appConfig).where(eq(schema.appConfig.key, key)).get();
    return row?.value;
  }
  
  async getOrDefault(key: string): Promise<string> {
    let value = await this.get(key);
    if (value === undefined) { value = defaults[key] ?? ""; await this.set(key, value); }
    return value;
  }
  
  async getBool(key: string): Promise<boolean> {
    return (await this.getOrDefault(key)) === "true";
  }
  
  async set(key: string, value: string) {
    const existing = await this.get(key);
    if (existing === undefined) await this.db.insert(schema.appConfig).values({ key, value });
    else await this.db.update(schema.appConfig).set({ value, updatedAt: new Date() }).where(eq(schema.appConfig.key, key));
  }
  
  async getAll() {
    const rows = await this.db.select().from(schema.appConfig).all();
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    for (const k of Object.keys(defaults)) if (!(k in out)) { await this.set(k, defaults[k]); out[k] = defaults[k]; }
    return out;
  }
}
