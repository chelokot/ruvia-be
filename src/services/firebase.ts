import fsp from "node:fs/promises";
import path from "node:path";
import type * as firebase from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function initFirebase(): firebase.auth.Auth {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    throw new Error("Firebase admin env is not set: missing FIREBASE_PROJECT_ID");
  }

  // Replace literal \n with actual newlines for dotenv-loaded keys
  const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");
  const haveServiceAccount = !!clientEmail && !!privateKey;

  const app = initializeApp(
    haveServiceAccount
      ? {
          credential: cert({ projectId, clientEmail: clientEmail!, privateKey: privateKey! }),
          projectId,
        }
      : { projectId }
  );

  return getAuth(app);
}

export async function injectFirebaseCredentials() {
  const data = await fsp.readFile(
    path.join(process.cwd(), "firebase-service.json"),
  );
  const parsed = JSON.parse(data.toString());
  process.env.FIREBASE_PROJECT_ID = parsed.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = parsed.client_email;
  process.env.FIREBASE_PRIVATE_KEY = parsed.private_key;
}
