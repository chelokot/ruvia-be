import { serve } from "@hono/node-server";
import type { Auth } from "firebase-admin/auth";
import { type Context, Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { createInitMiddleware } from "../middleware/init.js";
import { generateRoute } from "../routes/generate.js";
import { sessionRoute } from "../routes/session.js";
import { authRoutes } from "../routes/auth.js";
import { type Database, initDatabaseClient } from "./database.js";
import { initFirebase } from "./firebase.js";
import type { User } from "./user.js";

export type AppEnv<C = Record<string, unknown>> = {
  Variables: C & {
    auth: Auth;
    db: Database;
  };
};
export type AuthorizedAppEnv = AppEnv<{
  user: User;
}>;

export type AppContext = Context<AppEnv>;
export type AuthorizedAppContext = Context<AuthorizedAppEnv>;

export function buildApp() {
  const auth = initFirebase();
  const db = initDatabaseClient();

  const variables: AppEnv["Variables"] = { auth, db };

  const app = new Hono<AppEnv>()
    .use("*", createInitMiddleware(variables));

  // Public auth routes
  app.route("/", authRoutes);

  // Protected routes
  app.route("/session", new Hono<AppEnv>().use("*", authMiddleware).route("/", sessionRoute));
  app.route("/generate", new Hono<AppEnv>().use("*", authMiddleware).route("/", generateRoute));

  return app;
}

export function startServer() {
  const app = buildApp();
  serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  });
}
