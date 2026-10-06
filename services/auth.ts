import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import type { AuthCredentials } from '@/types/auth';

export async function signInWithEmail({
  email,
  password,
}: AuthCredentials): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail({
  email,
  password,
}: AuthCredentials): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
