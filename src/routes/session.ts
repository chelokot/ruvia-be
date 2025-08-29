import { Hono } from "hono";
import type { AppEnv } from "../services/app.js";

export const sessionRoute = new Hono<AppEnv>().post("/", async (context) => {
  return context.json({ ok: true });
});
