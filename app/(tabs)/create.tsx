import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    GenerateButton,
    ImagePreview,
    StyleCard,
    UploadCard,
} from '@/components/create';
import { ANIME_STYLES, getAnimeStyleById } from '@/constants/animeStyles';
import { useImagePicker } from '@/hooks/useImagePicker';
import { getErrorMessage, showAlert } from '@/lib/alert';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError, generateAnime } from '@/services/api';
import { uploadImageToCloudinary } from '@/services/cloudinary';
import { saveGeneration } from '@/services/generation';
import { saveProject } from '@/services/projects';
import type { AnimeStyleId } from '@/types/animeStyle';

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
      window.open(url, '_blank');
    });
}

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { image, picking, pickFromGallery, clearImage } = useImagePicker();
  const [selectedStyle, setSelectedStyle] = useState<AnimeStyleId | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');

  // Holds the result after a successful generation
  const [result, setResult] = useState<{
    generationId: string;
    originalImageUrl: string;
    generatedImageUrl: string;
    styleLabel: string;
  } | null>(null);

  async function handleUploadPress() {
    await pickFromGallery();
  }

  async function handleGenerate() {
    if (!image?.uri) {
      showAlert('Photo required', 'Upload a photo before generating anime.');
      return;
    }
    if (!selectedStyle) {
      showAlert('Style required', 'Pick an anime style to continue.');
      return;
    }
    if (!user?.uid) {
      showAlert('Sign in required', 'Please sign in again to generate anime.');
      return;
    }

    const style = getAnimeStyleById(selectedStyle);
    if (!style) {
      showAlert('Style required', 'Pick a valid anime style to continue.');
      return;
    }

    try {
      setGenerating(true);
      setResult(null);
      setGeneratingStatus('Uploading photo…');

      // 1) Upload selected photo → Cloudinary public URL
      const publicImageUrl = await uploadImageToCloudinary(image.uri);

      setGeneratingStatus('Generating anime… this can take 1–3 minutes on first run.');

      // 2) Generate anime via FastAPI / Replicate
      const apiResult = await generateAnime({
        image_url: publicImageUrl,
        anime_style: style.label,
        quality: 'fast',
      });

      setGeneratingStatus('Saving to library…');

      // 3) Save to generation history
      let generationId = '';
      try {
        generationId = await saveGeneration({
          uid: user.uid,
          originalImage: publicImageUrl,
          generatedImage: apiResult.image_url,
          animeStyle: style.label,
          quality: 'fast',
        });
      } catch (saveError) {
        console.warn('[create] Failed to save generation history', saveError);
      }

      // 4) Store result in state — show inline result panel with download button
      setResult({
        generationId,
        originalImageUrl: publicImageUrl,
        generatedImageUrl: apiResult.image_url,
        styleLabel: style.label,
      });
      setGeneratingStatus('');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.detail
          : getErrorMessage(error, 'Unable to generate anime right now.');
      showAlert('Generation failed', message);
      setGeneratingStatus('');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!result || !user?.uid) return;

    try {
      setDownloading(true);

      const title = `${result.styleLabel || 'Anime'} — ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      await saveProject({
        ownerId: user.uid,
        title,
        thumbnailURL: result.generatedImageUrl,
      });

      if (Platform.OS === 'web') {
        const filename = `anime-${result.styleLabel.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        downloadImageWeb(result.generatedImageUrl, filename);
        showAlert('Saved to Projects', 'Image downloaded and saved to your projects.');
      } else {
        showAlert('Saved to Projects', 'Generation saved to your projects.');
      }
    } catch (error) {
      showAlert('Download failed', getErrorMessage(error, 'Could not save this generation.'));
    } finally {
      setDownloading(false);
    }
  }

  function handleViewFullPreview() {
    if (!result) return;
    router.push({
      pathname: '/preview',
      params: {
        generationId: result.generationId,
        imageUri: result.originalImageUrl,
        generatedImageUrl: result.generatedImageUrl,
        styleLabel: result.styleLabel,
        quality: 'fast',
        createdAt: String(Date.now()),
      },
    });
  }

  function handleReset() {
    setResult(null);
  }

  const busy = picking || generating;

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#2e1065', '#050508', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="px-5 pb-12 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xs font-semibold uppercase tracking-[0.25em] text-anime-purple-300">
            Create
          </Text>
          <Text className="mt-2 text-3xl font-bold text-white">
            Transform into anime
          </Text>
          <Text className="mt-2 text-sm leading-5 text-anime-mute">
            Upload a photo, choose a style, then generate your anime look.
          </Text>

          {/* ── Result panel — shown after successful generation ── */}
          {result ? (
            <View className="mt-6">
              <Text className="mb-3 text-lg font-semibold text-white">
                ✨ Your anime is ready!
              </Text>

              {/* Generated image — full size, no crop */}
              <View className="overflow-hidden rounded-3xl border border-anime-border bg-white/5">
                <Text className="px-4 pt-4 text-xs uppercase tracking-wide text-anime-mute">
                  Generated
                </Text>
                <Image
                  source={{ uri: result.generatedImageUrl }}
                  className="mt-2 w-full"
                  style={{ aspectRatio: 1 }}
                  resizeMode="contain"
                />
              </View>

              {/* Original image — full size, no crop */}
              <View className="mt-4 overflow-hidden rounded-3xl border border-anime-border bg-white/5">
                <Text className="px-4 pt-4 text-xs uppercase tracking-wide text-anime-mute">
                  Original
                </Text>
                <Image
                  source={{ uri: result.originalImageUrl }}
                  className="mt-2 w-full"
                  style={{ aspectRatio: 1 }}
                  resizeMode="contain"
                />
              </View>

              {/* Action buttons */}
              <View className="mt-6 gap-3">
                {/* Download & save to projects */}
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

                {/* Full preview */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleViewFullPreview}
                  className="items-center rounded-2xl border border-anime-border bg-white/5 py-4 active:opacity-80"
                >
                  <Text className="font-semibold text-white">View Full Preview</Text>
                </Pressable>

                {/* Create another */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleReset}
                  className="items-center rounded-2xl bg-transparent py-4 active:opacity-70"
                >
                  <Text className="text-sm font-medium text-anime-mute">
                    + Create another
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ── Upload / style / generate form ── */
            <>
              <View className="mt-8">
                {image?.uri ? (
                  <ImagePreview
                    uri={image.uri}
                    onChangePress={busy ? undefined : handleUploadPress}
                    onClearPress={busy ? undefined : clearImage}
                  />
                ) : (
                  <UploadCard onPress={handleUploadPress} disabled={busy} />
                )}
              </View>

              <View className="mt-8">
                <Text className="text-lg font-semibold text-white">Anime Style</Text>
                <Text className="mt-1 text-sm text-anime-mute">
                  Select one look for your generation.
                </Text>

                <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
                  {ANIME_STYLES.map((styleOption, index) => (
                    <StyleCard
                      key={styleOption.id}
                      styleOption={styleOption}
                      selected={selectedStyle === styleOption.id}
                      index={index}
                      onPress={() => {
                        if (!busy) setSelectedStyle(styleOption.id);
                      }}
                    />
                  ))}
                </View>
              </View>

              <View className="mt-10">
                <GenerateButton
                  onPress={handleGenerate}
                  disabled={busy}
                  loading={generating}
                  label={generating ? 'Generating…' : 'Generate Anime'}
                />
                <Text className="mt-3 text-center text-xs text-anime-mute">
                  {generatingStatus
                    ? generatingStatus
                    : 'Photo → Cloudinary → FastAPI → Replicate'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
