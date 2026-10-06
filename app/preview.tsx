import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { getAnimeStyleById } from '@/constants/animeStyles';
import { getErrorMessage, showAlert } from '@/lib/alert';
import { useAuth } from '@/providers/AuthProvider';
import { deleteGeneration } from '@/services/generation';
import { saveProject } from '@/services/projects';

function formatCreatedAtParam(value?: string): string {
  if (!value) return '—';
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Triggers a browser download of the image at the given URL. Web only. */
function downloadImageWeb(url: string, filename: string) {
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    })
    .catch(() => {
      // Fallback: open in new tab if blob fetch fails (e.g. CORS)
      window.open(url, '_blank');
    });
}

export default function PreviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const params = useLocalSearchParams<{
    generationId?: string;
    imageUri?: string;
    generatedImageUrl?: string;
    styleId?: string;
    animeStyle?: string;
    quality?: string;
    createdAt?: string;
  }>();

  const generationId =
    typeof params.generationId === 'string' ? params.generationId : '';
  const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
  const generatedImageUrl =
    typeof params.generatedImageUrl === 'string' ? params.generatedImageUrl : '';
  const animeStyleLabel =
    typeof params.animeStyle === 'string' && params.animeStyle
      ? params.animeStyle
      : getAnimeStyleById(
          typeof params.styleId === 'string' ? params.styleId : undefined,
        )?.label ?? '';
  const styleFromId = getAnimeStyleById(
    typeof params.styleId === 'string' ? params.styleId : undefined,
  );
  const quality =
    params.quality === 'premium' || params.quality === 'fast'
      ? params.quality
      : 'fast';
  const createdLabel = formatCreatedAtParam(
    typeof params.createdAt === 'string' ? params.createdAt : undefined,
  );

  if (!imageUri || !generatedImageUrl) {
    return (
      <View className="flex-1 items-center justify-center bg-anime-bg px-6">
        <Text className="text-center text-base text-anime-mute">
          Missing preview data. Go back and open a generation from Library.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-full bg-anime-purple-600/30 px-5 py-3"
        >
          <Text className="font-semibold text-anime-purple-300">Go back</Text>
        </Pressable>
      </View>
    );
  }

  async function handleDownload() {
    if (!user?.uid) {
      showAlert('Sign in required', 'Please sign in to download.');
      return;
    }

    try {
      setDownloading(true);

      // 1) Save to the user's projects collection
      const title = `${animeStyleLabel || 'Anime'} — ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      await saveProject({
        ownerId: user.uid,
        title,
        thumbnailURL: generatedImageUrl,
      });

      // 2) Trigger download (web) or show success alert (native)
      if (Platform.OS === 'web') {
        const filename = `anime-${animeStyleLabel.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        downloadImageWeb(generatedImageUrl, filename);
        showAlert('Saved to Projects', 'Image downloaded and saved to your projects.');
      } else {
        showAlert('Saved to Projects', 'Generation saved to your projects.');
      }
    } catch (error) {
      showAlert(
        'Download failed',
        getErrorMessage(error, 'Could not save this generation.'),
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!user?.uid || !generationId) return;

    try {
      setDeleting(true);
      await deleteGeneration(user.uid, generationId);
      showAlert('Deleted', 'Generation removed from your library.');
      router.replace('/(tabs)/library');
    } catch (error) {
      showAlert(
        'Delete failed',
        getErrorMessage(error, 'Could not delete this generation.'),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#4c1d95', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 260 }}
      />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-5 pb-10 pt-2">
          <Pressable onPress={() => router.back()} className="self-start py-2">
            <Text className="text-sm font-semibold text-anime-purple-300">
              ← Back
            </Text>
          </Pressable>

          <Text className="mt-2 text-3xl font-bold text-white">Preview</Text>
          <Text className="mt-2 text-sm text-anime-mute">
            Original photo, generated result, and metadata.
          </Text>

          {/* Metadata card */}
          <View className="mt-4 gap-2 rounded-2xl border border-anime-border bg-white/5 p-4">
            <Text className="text-xs uppercase tracking-wide text-anime-mute">Style</Text>
            <Text className="text-base font-semibold text-white">
              {styleFromId?.emoji ? `${styleFromId.emoji} ` : ''}
              {animeStyleLabel || '—'}
            </Text>
            <Text className="mt-2 text-xs uppercase tracking-wide text-anime-mute">Quality</Text>
            <Text className="text-base capitalize text-white">{quality}</Text>
            <Text className="mt-2 text-xs uppercase tracking-wide text-anime-mute">Created</Text>
            <Text className="text-base text-white">{createdLabel}</Text>
          </View>

          {/* Original image — full size, no crop */}
          <Animated.View
            entering={FadeIn.duration(400)}
            className="mt-6 overflow-hidden rounded-3xl border border-anime-border bg-white/5"
          >
            <Text className="px-4 pt-4 text-xs uppercase tracking-wide text-anime-mute">
              Original
            </Text>
            <Image
              source={{ uri: imageUri }}
              className="mt-2 w-full"
              style={{ aspectRatio: 1 }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Generated image — full size, no crop */}
          <Animated.View
            entering={FadeIn.delay(80).duration(400)}
            className="mt-4 overflow-hidden rounded-3xl border border-anime-border bg-white/5"
          >
            <Text className="px-4 pt-4 text-xs uppercase tracking-wide text-anime-mute">
              Generated
            </Text>
            <Image
              source={{ uri: generatedImageUrl }}
              className="mt-2 w-full"
              style={{ aspectRatio: 1 }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Action buttons */}
          <View className="mt-8 gap-3">
            {/* Download — saves to projects + downloads file */}
            <Pressable
              accessibilityRole="button"
              disabled={downloading}
              onPress={handleDownload}
              className={`items-center rounded-2xl border border-anime-purple-500/40 bg-anime-purple-600/20 py-4 ${
                downloading ? 'opacity-50' : 'active:opacity-80'
              }`}
            >
              {downloading ? (
                <ActivityIndicator color="#a78bfa" />
              ) : (
                <Text className="font-semibold text-anime-purple-300">
                  ⬇ Download &amp; Save to Projects
                </Text>
              )}
            </Pressable>

            {/* Delete */}
            {generationId ? (
              <Pressable
                accessibilityRole="button"
                disabled={deleting}
                onPress={handleDelete}
                className={`items-center rounded-2xl border border-red-500/40 bg-red-500/15 py-4 ${
                  deleting ? 'opacity-50' : 'active:opacity-80'
                }`}
              >
                {deleting ? (
                  <ActivityIndicator color="#fca5a5" />
                ) : (
                  <Text className="font-semibold text-red-300">Delete</Text>
                )}
              </Pressable>
            ) : null}

            <Button
              title="Create another"
              variant="secondary"
              onPress={() => router.replace('/(tabs)/create')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
