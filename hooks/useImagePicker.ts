import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { getErrorMessage, showAlert } from '@/lib/alert';

export type PickedImage = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
};

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [picking, setPicking] = useState(false);

  const clearImage = useCallback(() => {
    setImage(null);
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      setPicking(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          'Permission needed',
          'Allow photo library access to upload an image for anime generation.',
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const next: PickedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
      };

      setImage(next);
      return next;
    } catch (error) {
      showAlert(
        'Could not open gallery',
        getErrorMessage(error, 'Something went wrong while picking an image.'),
      );
      return null;
    } finally {
      setPicking(false);
    }
  }, []);

  return {
    image,
    picking,
    pickFromGallery,
    clearImage,
    setImage,
  };
}
