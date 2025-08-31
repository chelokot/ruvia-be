import { serve } from "@hono/node-server";
import type { Auth } from "firebase-admin/auth";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "../middleware/auth.js";
import { createInitMiddleware } from "../middleware/init.js";
import { generateRoute } from "../routes/generate.js";
import { sessionRoute } from "../routes/session.js";
import { purchaseRoute } from "../routes/purchase.js";
import { initFirebase } from "./firebase.js";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export type AppEnv<C = Record<string, unknown>> = {
  Variables: C & {
    auth: Auth;
    firestore: Firestore;
  };
};
export type AuthorizedAppEnv = AppEnv<{ user: { firebaseId: string; name: string; balance: number; isNew: boolean; generationCount: number } }>;

export type AppContext = Context<AppEnv>;
export type AuthorizedAppContext = Context<AuthorizedAppEnv>;

export async function initApp() {
  await injectFirebaseCredentials();

  const auth = initFirebase();
  const firestore = getFirestore();

  const variables: AppEnv["Variables"] = { auth, firestore };

  const app = new Hono<AppEnv>()
    .use("*", cors())
    .use("*", createInitMiddleware(variables))
    .use("*", authMiddleware);

  app.route("/session", sessionRoute);
  app.route("/generate", generateRoute);
  app.route("/purchase", purchaseRoute);

  return () => {
    serve({ fetch: app.fetch, port: 3000 }, (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    });
  };
}
