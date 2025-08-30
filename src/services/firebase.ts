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
