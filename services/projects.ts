import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { AnimeProject } from '@/types/project';

export const PROJECTS_COLLECTION = 'projects';

export async function getRecentProjects(
  ownerId: string,
  limitCount = 6,
): Promise<AnimeProject[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('ownerId', '==', ownerId),
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as AnimeProject)
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() ?? 0;
      const bTime = b.updatedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limitCount);
}

export type SaveProjectInput = {
  ownerId: string;
  title: string;
  thumbnailURL: string;
};

/**
 * Saves a downloaded generation as a project under the top-level `projects` collection.
 * Returns the new document id.
 */
export async function saveProject(input: SaveProjectInput): Promise<string> {
  const ref = await addDoc(collection(db, PROJECTS_COLLECTION), {
    ownerId: input.ownerId,
    title: input.title,
    status: 'ready',
    thumbnailURL: input.thumbnailURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}
