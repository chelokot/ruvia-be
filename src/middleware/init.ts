import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../services/app.js";

export function createInitMiddleware(
  variables: AppContext["Variables"],
): MiddlewareHandler {
  return async (context, next) => {
    for (const [key, value] of Object.entries(variables)) {
      context.set(key, value);
    }
    await next();
  };
}
