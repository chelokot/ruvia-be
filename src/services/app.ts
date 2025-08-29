import { serve } from "@hono/node-server";
import type { Auth } from "firebase-admin/auth";
import { type Context, Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { createInitMiddleware } from "../middleware/init.js";
import { sessionRoute } from "../routes/session.js";
import { initFirebase } from "./firebase.js";

export type AppEnv = {
  Variables: {
    auth: Auth;
  };
};

export type AppContext = Context<AppEnv>;

export function initApp() {
  const auth = initFirebase();

  const variables: AppEnv["Variables"] = { auth };

  const app = new Hono<AppEnv>()
    .use("*", createInitMiddleware(variables))
    .use("*", authMiddleware);

  app.route("/session", sessionRoute);

  return () => {
    serve({ fetch: app.fetch, port: 3000 }, (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    });
  };
}
