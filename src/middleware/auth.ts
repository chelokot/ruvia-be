import type { Next } from "hono";
import type { AppContext } from "../services/app.js";

export async function authMiddleware(context: AppContext, next: Next) {
  const body = await context.req.json().catch(() => null);
  const idToken = body && typeof body.token === "string" ? body.token : "";

  if (!idToken) {
    return context.json({ ok: false }, 400);
  }

  try {
    await context.var.auth.verifyIdToken(idToken);
    await next();
  } catch {
    return context.json({ ok: false }, 401);
  }
}
