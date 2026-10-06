import type { Timestamp } from 'firebase/firestore';

export type VideoMode = 'image' | 'text';
export type VideoDuration = 'short' | 'long';

export type VideoGeneration = {
  id: string;
  mode: VideoMode;
  prompt: string | null;
  originalImage: string | null;
  videoUrl: string;
  animeStyle: string;
  duration: VideoDuration;
  createdAt: Timestamp | null;
};

export type SaveVideoInput = {
  uid: string;
  mode: VideoMode;
  prompt: string | null;
  originalImage: string | null;
  videoUrl: string;
  animeStyle: string;
  duration: VideoDuration;
};

export type GenerateVideoRequest = {
  mode: VideoMode;
  image_url?: string;
  prompt?: string;
  anime_style: string;
  duration: VideoDuration;
};

export type GenerateVideoResponse = {
  status: 'success';
  video_url: string;
  mode: VideoMode;
  duration: VideoDuration;
};
