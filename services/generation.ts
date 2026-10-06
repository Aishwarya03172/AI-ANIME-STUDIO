import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { USERS_COLLECTION } from '@/services/firestore';
import type {
  Generation,
  GenerationQuality,
  SaveGenerationInput,
} from '@/types/generation';

export const GENERATIONS_SUBCOLLECTION = 'generations';

function generationsCollection(uid: string) {
  return collection(db, USERS_COLLECTION, uid, GENERATIONS_SUBCOLLECTION);
}

function generationDoc(uid: string, generationId: string) {
  return doc(db, USERS_COLLECTION, uid, GENERATIONS_SUBCOLLECTION, generationId);
}

function mapGenerationDoc(
  id: string,
  data: Record<string, unknown>,
): Generation {
  const quality = data.quality === 'premium' ? 'premium' : 'fast';

  return {
    id,
    originalImage: String(data.originalImage ?? ''),
    generatedImage: String(data.generatedImage ?? ''),
    animeStyle: String(data.animeStyle ?? ''),
    quality: quality as GenerationQuality,
    createdAt: (data.createdAt as Generation['createdAt']) ?? null,
  };
}

/**
 * Saves a generation under `users/{uid}/generations/{generationId}`.
 * Returns the new document id.
 */
export async function saveGeneration(
  input: SaveGenerationInput,
): Promise<string> {
  const ref = await addDoc(generationsCollection(input.uid), {
    originalImage: input.originalImage,
    generatedImage: input.generatedImage,
    animeStyle: input.animeStyle,
    quality: input.quality,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

/**
 * One-shot fetch of the user's generations (newest first).
 */
export async function getGenerations(uid: string): Promise<Generation[]> {
  const q = query(generationsCollection(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((item) =>
    mapGenerationDoc(item.id, item.data() as Record<string, unknown>),
  );
}

/**
 * Deletes `users/{uid}/generations/{generationId}`.
 */
export async function deleteGeneration(
  uid: string,
  generationId: string,
): Promise<void> {
  await deleteDoc(generationDoc(uid, generationId));
}

/**
 * Live subscription for Library auto-refresh.
 */
export function subscribeToGenerations(
  uid: string,
  onData: (items: Generation[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(generationsCollection(uid), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((item) =>
        mapGenerationDoc(item.id, item.data() as Record<string, unknown>),
      );
      onData(items);
    },
    (error) => {
      onError?.(error);
    },
  );
}
