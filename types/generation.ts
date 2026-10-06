import type { Timestamp } from 'firebase/firestore';

export type GenerationQuality = 'fast' | 'premium';

export type Generation = {
  id: string;
  originalImage: string;
  generatedImage: string;
  animeStyle: string;
  quality: GenerationQuality;
  createdAt: Timestamp | null;
};

export type SaveGenerationInput = {
  uid: string;
  originalImage: string;
  generatedImage: string;
  animeStyle: string;
  quality: GenerationQuality;
};
