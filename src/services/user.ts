import { FieldValue, type Firestore } from "firebase-admin/firestore";

export type User = {
  firebaseId: string;
  name: string;
  balance: number;
  isNew: boolean;
  generationCount: number;
  createdAt?: unknown;
};

type FindUserAndUpdateArgs = {
  firestore: Firestore;
  firebaseId: string;
  name: string;
};

export async function findUserAndUpdate({ firestore, firebaseId, name }: FindUserAndUpdateArgs): Promise<User> {
  const ref = firestore.collection("users").doc(firebaseId);
  const snap = await ref.get();
  if (!snap.exists) {
    const user: User = { firebaseId, name, balance: 1, isNew: true, generationCount: 0, createdAt: FieldValue.serverTimestamp() };
    await ref.set(user);
    return { ...user, createdAt: undefined };
  }
  const data = snap.data() as Partial<User> | undefined;
  const current: User = {
    firebaseId,
    name: data?.name ?? name,
    balance: typeof data?.balance === "number" ? data.balance : 0,
    isNew: typeof data?.isNew === "boolean" ? data.isNew : false,
    generationCount: typeof data?.generationCount === "number" ? data.generationCount : 0,
    createdAt: data?.createdAt,
  };
  if (current.name !== name) {
    await ref.update({ name });
    current.name = name;
  }
  return current;
}

type UseBalanceArgs = { firestore: Firestore; firebaseId: string; amount: number };

export async function useBalance({ firestore, firebaseId, amount }: UseBalanceArgs): Promise<boolean> {
  const ref = firestore.collection("users").doc(firebaseId);
  return await firestore.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return false;
    const data = snap.data() as Partial<User> | undefined;
    const current = typeof data?.balance === "number" ? data.balance : 0;
    if (current < amount) return false;
    transaction.update(ref, { balance: current - amount });
    return true;
  });
}

type MarkGenerationArgs = { firestore: Firestore; firebaseId: string };

export async function markGenerationCompleted({ firestore, firebaseId }: MarkGenerationArgs): Promise<void> {
  const ref = firestore.collection("users").doc(firebaseId);
  await ref.update({ isNew: false, generationCount: FieldValue.increment(1) });
}
