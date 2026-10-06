/**
 * Cloudinary unsigned image uploads for AI Anime Studio.
 *
 * Uses EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME + EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 * Never put Cloudinary API secrets in the client app.
 */

export type CloudinaryUploadResponse = {
  secure_url: string;
  url?: string;
  public_id?: string;
  [key: string]: unknown;
};

function getCloudinaryConfig() {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.',
    );
  }

  return { cloudName, uploadPreset };
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Failed to read image file (${response.status})`);
  }

  return response.blob();
}

/**
 * Upload a local image URI to Cloudinary (unsigned preset).
 * Returns the HTTPS `secure_url` for FastAPI / Replicate.
 */
export async function uploadImageToCloudinary(uri: string): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append('upload_preset', uploadPreset);

  // React Native / Expo: prefer file-style payload; web blob also works.
  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    const blob = await uriToBlob(uri);
    form.append('file', blob, 'upload.jpg');
  } else {
    form.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as unknown as Blob);
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error(
      'Could not reach Cloudinary. Check your network connection and try again.',
    );
  }

  const data = (await response.json()) as CloudinaryUploadResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Cloudinary upload failed (${response.status})`,
    );
  }

  if (!data.secure_url || typeof data.secure_url !== 'string') {
    throw new Error('Cloudinary did not return a secure_url.');
  }

  return data.secure_url;
}
