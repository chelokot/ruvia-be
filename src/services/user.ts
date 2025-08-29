import type { Database } from "./database.js";

export type User = {
  firebaseId: string;
  name: string;
  credits: number;
};

type FindUserAndUpdateArgs = {
  db: Database;
  firebaseId: string;
  name: string;
};

export async function findUserAndUpdate({
  db,
  firebaseId,
  name,
}: FindUserAndUpdateArgs) {
  const user = await db.user.findOneAndUpdate(
    { firebaseId },
    {
      $set: { name },
      $setOnInsert: { credits: 1 },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

type UseCreditsArgs = {
  db: Database;
  firebaseId: string;
  amount: number;
};

export async function useCredits({ db, firebaseId, amount }: UseCreditsArgs) {
  const result = await db.user.updateOne(
    { firebaseId },
    { $inc: { credits: -amount } },
  );

  return result.modifiedCount > 0;
}
