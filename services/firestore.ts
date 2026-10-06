import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from '@/types/user';

export const USERS_COLLECTION = 'users';

function userDocRef(uid: string) {
  return doc(db, USERS_COLLECTION, uid);
}

/**
 * Creates `users/{uid}` on first sign-in.
 * If the document already exists, it is left untouched.
 */
export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<void> {
  const ref = userDocRef(input.uid);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    return;
  }

  await setDoc(ref, {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName ?? null,
    photoURL: input.photoURL ?? null,
    subscription: input.subscription ?? 'Free',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileInput,
): Promise<void> {
  await updateDoc(userDocRef(uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, documentId));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function setDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T,
  merge = true,
): Promise<void> {
  await setDoc(doc(db, collectionName, documentId), data, { merge });
}

export async function queryCollection<T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((item) => item.data() as T);
}

export { where };
