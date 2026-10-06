import type { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'failed';

export type AnimeProject = {
  id: string;
  ownerId: string;
  title: string;
  status: ProjectStatus;
  thumbnailURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
