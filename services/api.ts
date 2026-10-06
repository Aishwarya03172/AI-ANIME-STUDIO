import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type GenerateAnimeQuality = 'fast' | 'premium';

export type GenerateAnimeRequest = {
  image_url: string;
  anime_style: string;
  quality?: GenerateAnimeQuality;
};

export type GenerateAnimeResponse = {
  status: 'success';
  image_url: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * FastAPI base URL.
 * Override with EXPO_PUBLIC_API_URL in `.env` when needed
 * (e.g. Android emulator → http://10.0.2.2:8000).
 */
function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  // Hosted Expo / tunnel: prefer the debugger host machine IP when available.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri ??
    '';

  if (
    Platform.OS !== 'web' &&
    hostUri &&
    !hostUri.includes('localhost') &&
    !hostUri.includes('127.0.0.1')
  ) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:8000`;
    }
  }

  return 'http://127.0.0.1:8000';
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) =>
          typeof item === 'object' && item && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : JSON.stringify(item),
        )
        .join(', ');
    }
  } catch {
    // Fall through to status text.
  }

  return response.statusText || `Request failed (${response.status})`;
}

/**
 * Call FastAPI `POST /generate-anime`.
 */
export async function generateAnime(
  payload: GenerateAnimeRequest,
): Promise<GenerateAnimeResponse> {
  const baseUrl = getApiBaseUrl();
  const body: GenerateAnimeRequest = {
    image_url: payload.image_url,
    anime_style: payload.anime_style,
    quality: payload.quality ?? 'fast',
  };

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/generate-anime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the anime API. Is the FastAPI server running on port 8000?',
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new ApiError(response.status, detail);
  }

  const data = (await response.json()) as Partial<GenerateAnimeResponse>;

  if (data.status !== 'success' || typeof data.image_url !== 'string') {
    throw new ApiError(500, 'Unexpected response from the anime API.');
  }

  return {
    status: 'success',
    image_url: data.image_url,
  };
}
