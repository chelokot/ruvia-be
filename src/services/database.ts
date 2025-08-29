import { type Collection, MongoClient } from "mongodb";
import type { User } from "./user.js";

export type Database = {
  user: Collection<User>;
};

export function initDatabaseClient(): Database {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const name = process.env.DB_NAME;

  if (!host || !port || !name) {
    throw new Error("Mongodb database env is not set");
  }

  const client = new MongoClient(`mongodb://${host}:${port}`);
  const db = client.db(name);

  return {
    user: db.collection("users"),
  };
}
