import {
  addDoc,
  collection,
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
  GenerateVideoRequest,
  GenerateVideoResponse,
  SaveVideoInput,
  VideoGeneration,
} from '@/types/video';

export const VIDEOS_SUBCOLLECTION = 'videos';

// ── Firestore helpers ──────────────────────────────────────────────────────────

function videosCollection(uid: string) {
  return collection(db, USERS_COLLECTION, uid, VIDEOS_SUBCOLLECTION);
}

function mapVideoDoc(id: string, data: Record<string, unknown>): VideoGeneration {
  return {
    id,
    mode: (data.mode as VideoGeneration['mode']) ?? 'text',
    prompt: typeof data.prompt === 'string' ? data.prompt : null,
    originalImage: typeof data.originalImage === 'string' ? data.originalImage : null,
    videoUrl: String(data.videoUrl ?? ''),
    animeStyle: String(data.animeStyle ?? ''),
    duration: (data.duration as VideoGeneration['duration']) ?? 'short',
    createdAt: (data.createdAt as VideoGeneration['createdAt']) ?? null,
  };
}

export async function saveVideo(input: SaveVideoInput): Promise<string> {
  const ref = await addDoc(videosCollection(input.uid), {
    mode: input.mode,
    prompt: input.prompt ?? null,
    originalImage: input.originalImage ?? null,
    videoUrl: input.videoUrl,
    animeStyle: input.animeStyle,
    duration: input.duration,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getVideos(uid: string): Promise<VideoGeneration[]> {
  const q = query(videosCollection(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapVideoDoc(d.id, d.data() as Record<string, unknown>));
}

export function subscribeToVideos(
  uid: string,
  onData: (items: VideoGeneration[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(videosCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapVideoDoc(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => onError?.(err),
  );
}

// ── API call ───────────────────────────────────────────────────────────────────

function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://127.0.0.1:8000';
}

export class VideoApiError extends Error {
  readonly status: number;
  readonly detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'VideoApiError';
    this.status = status;
    this.detail = detail;
  }
}

export async function generateVideo(
  payload: GenerateVideoRequest,
): Promise<GenerateVideoResponse> {
  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new VideoApiError(
      0,
      'Cannot reach the video API. Is the FastAPI server running on port 8000?',
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (typeof data.detail === 'string') detail = data.detail;
    } catch {}
    throw new VideoApiError(response.status, detail);
  }

  const data = (await response.json()) as Partial<GenerateVideoResponse>;
  if (data.status !== 'success' || typeof data.video_url !== 'string') {
    throw new VideoApiError(500, 'Unexpected response from the video API.');
  }

  return {
    status: 'success',
    video_url: data.video_url,
    mode: data.mode ?? payload.mode,
    duration: data.duration ?? payload.duration,
  };
}
