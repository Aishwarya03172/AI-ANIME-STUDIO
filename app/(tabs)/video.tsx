import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ANIME_STYLES } from '@/constants/animeStyles';
import { useImagePicker } from '@/hooks/useImagePicker';
import { getErrorMessage, showAlert } from '@/lib/alert';
import { useAuth } from '@/providers/AuthProvider';
import { uploadImageToCloudinary } from '@/services/cloudinary';
import { generateVideo, saveVideo, VideoApiError } from '@/services/video';
import { saveProject } from '@/services/projects';
import type { AnimeStyleId } from '@/types/animeStyle';
import type { VideoDuration, VideoMode } from '@/types/video';

/** Triggers a browser download. Web only. */
function downloadWeb(url: string, filename: string) {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const obj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = obj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(obj);
    })
    .catch(() => window.open(url, '_blank'));
}

type Result = {
  videoUrl: string;
  mode: VideoMode;
  styleLabel: string;
  prompt: string | null;
  originalImage: string | null;
};

export default function VideoScreen() {
  const { user } = useAuth();
  const { image, picking, pickFromGallery, clearImage } = useImagePicker();

  const [mode, setMode] = useState<VideoMode>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AnimeStyleId>('modern-anime');
  const [duration, setDuration] = useState<VideoDuration>('short');
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const busy = picking || generating;

  async function handleGenerate() {
    if (!user?.uid) {
      showAlert('Sign in required', 'Please sign in to generate videos.');
      return;
    }
    if (mode === 'image' && !image?.uri) {
      showAlert('Image required', 'Upload an anime image to animate.');
      return;
    }
    if (mode === 'text' && !prompt.trim()) {
      showAlert('Prompt required', 'Describe the anime video you want to generate.');
      return;
    }

    const style = ANIME_STYLES.find((s) => s.id === selectedStyle);
    if (!style) return;

    try {
      setGenerating(true);
      setResult(null);
      setStatus(mode === 'image' ? 'Uploading image…' : 'Preparing request…');

      let imageUrl: string | null = null;
      if (mode === 'image' && image?.uri) {
        imageUrl = await uploadImageToCloudinary(image.uri);
      }

      setStatus('Generating video… this can take 3–5 minutes.');

      const apiResult = await generateVideo({
        mode,
        image_url: imageUrl ?? undefined,
        prompt: mode === 'text' ? prompt.trim() : undefined,
        anime_style: style.label,
        duration,
      });

      setStatus('Saving to library…');

      try {
        await saveVideo({
          uid: user.uid,
          mode,
          prompt: mode === 'text' ? prompt.trim() : null,
          originalImage: imageUrl,
          videoUrl: apiResult.video_url,
          animeStyle: style.label,
          duration,
        });
      } catch (e) {
        console.warn('[video] failed to save to library', e);
      }

      setResult({
        videoUrl: apiResult.video_url,
        mode,
        styleLabel: style.label,
        prompt: mode === 'text' ? prompt.trim() : null,
        originalImage: imageUrl,
      });
      setStatus('');
    } catch (error) {
      const msg =
        error instanceof VideoApiError
          ? error.detail
          : getErrorMessage(error, 'Unable to generate video right now.');
      showAlert('Generation failed', msg);
      setStatus('');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!result || !user?.uid) return;
    try {
      setDownloading(true);
      const title = `${result.styleLabel} Video — ${new Date().toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
      })}`;
      await saveProject({ ownerId: user.uid, title, thumbnailURL: result.originalImage ?? result.videoUrl });

      if (Platform.OS === 'web') {
        const filename = `anime-video-${result.styleLabel.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`;
        downloadWeb(result.videoUrl, filename);
        showAlert('Saved', 'Video downloaded and saved to your projects.');
      } else {
        showAlert('Saved', 'Video saved to your projects.');
      }
    } catch (error) {
      showAlert('Save failed', getErrorMessage(error, 'Could not save video.'));
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPrompt('');
    clearImage();
    setStatus('');
  }

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#1e0a3c', '#050508', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="px-5 pb-16 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xs font-semibold uppercase tracking-[0.25em] text-anime-purple-300">
            Generate Video
          </Text>
          <Text className="mt-2 text-3xl font-bold text-white">
            Animate your anime
          </Text>
          <Text className="mt-2 text-sm leading-5 text-anime-mute">
            Animate an image or generate a video from a text prompt.
          </Text>

          {result ? (
            /* ── Result panel ── */
            <View className="mt-6">
              <Text className="mb-3 text-lg font-semibold text-white">🎬 Your video is ready!</Text>

              {/* Video preview — web uses <video>, native shows URL link */}
              <View className="overflow-hidden rounded-3xl border border-anime-border bg-white/5 p-4">
                {Platform.OS === 'web' ? (
                  // @ts-expect-error — video is a valid HTML element on web
                  <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    style={{ width: '100%', borderRadius: 16, maxHeight: 400 }}
                  />
                ) : (
                  <View className="items-center gap-3 py-4">
                    <Text className="text-4xl">🎬</Text>
                    <Text className="text-center text-sm text-white">Video generated!</Text>
                    <Text className="text-center text-xs text-anime-mute" selectable>
                      {result.videoUrl}
                    </Text>
                  </View>
                )}
              </View>

              {/* Original image if image mode */}
              {result.originalImage ? (
                <View className="mt-4 overflow-hidden rounded-3xl border border-anime-border bg-white/5">
                  <Text className="px-4 pt-4 text-xs uppercase tracking-wide text-anime-mute">
                    Source Image
                  </Text>
                  <Image
                    source={{ uri: result.originalImage }}
                    className="mt-2 w-full"
                    style={{ aspectRatio: 1 }}
                    resizeMode="contain"
                  />
                </View>
              ) : null}

              {/* Prompt used */}
              {result.prompt ? (
                <View className="mt-4 rounded-2xl border border-anime-border bg-white/5 p-4">
                  <Text className="text-xs uppercase tracking-wide text-anime-mute">Prompt</Text>
                  <Text className="mt-1 text-sm text-white">{result.prompt}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View className="mt-6 gap-3">
                <Pressable
                  accessibilityRole="button"
                  disabled={downloading}
                  onPress={handleDownload}
                  className={`items-center rounded-2xl border border-anime-purple-500/40 bg-anime-purple-600/20 py-4 ${downloading ? 'opacity-50' : 'active:opacity-80'}`}
                >
                  {downloading ? (
                    <ActivityIndicator color="#a78bfa" />
                  ) : (
                    <Text className="font-semibold text-anime-purple-300">
                      ⬇ Download &amp; Save to Projects
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleReset}
                  className="items-center rounded-2xl border border-anime-border bg-white/5 py-4 active:opacity-80"
                >
                  <Text className="font-semibold text-white">+ Generate another</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ── Generation form ── */
            <>
              {/* Mode toggle */}
              <View className="mt-6 flex-row rounded-2xl border border-anime-border bg-white/5 p-1">
                {(['text', 'image'] as VideoMode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => { if (!busy) setMode(m); }}
                    className={`flex-1 items-center rounded-xl py-2.5 ${mode === m ? 'bg-anime-purple-600' : ''}`}
                  >
                    <Text className={`text-sm font-semibold ${mode === m ? 'text-white' : 'text-anime-mute'}`}>
                      {m === 'text' ? '✍ Text → Video' : '🖼 Image → Video'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Text prompt input */}
              {mode === 'text' && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-white">Describe your video</Text>
                  <TextInput
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="e.g. anime girl walking through cherry blossoms at sunset…"
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    editable={!busy}
                    className="mt-2 rounded-2xl border border-anime-border bg-white/5 p-4 text-sm text-white"
                    style={{ minHeight: 90, textAlignVertical: 'top' }}
                  />
                </View>
              )}

              {/* Image upload */}
              {mode === 'image' && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-white">Source image</Text>
                  <Text className="mt-1 text-xs text-anime-mute">
                    Upload an anime image to animate into a video clip.
                  </Text>
                  {image?.uri ? (
                    <View className="mt-3 overflow-hidden rounded-3xl border border-anime-border bg-white/5">
                      <Image
                        source={{ uri: image.uri }}
                        className="w-full"
                        style={{ aspectRatio: 1 }}
                        resizeMode="contain"
                      />
                      <Pressable
                        onPress={() => { if (!busy) clearImage(); }}
                        className="m-3 items-center rounded-xl border border-anime-border bg-white/5 py-2.5"
                      >
                        <Text className="text-sm text-anime-mute">Change image</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { if (!busy) pickFromGallery(); }}
                      disabled={busy}
                      className="mt-3 items-center justify-center rounded-3xl border border-dashed border-anime-border bg-white/3 py-12"
                    >
                      {picking ? (
                        <ActivityIndicator color="#a78bfa" />
                      ) : (
                        <>
                          <Text className="text-4xl">🖼</Text>
                          <Text className="mt-2 text-sm font-semibold text-white">
                            Upload anime image
                          </Text>
                          <Text className="mt-1 text-xs text-anime-mute">
                            Tap to pick from gallery
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              )}

              {/* Style selector */}
              <View className="mt-6">
                <Text className="text-sm font-semibold text-white">Anime Style</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {ANIME_STYLES.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => { if (!busy) setSelectedStyle(s.id as AnimeStyleId); }}
                      className={`rounded-xl border px-3 py-2 ${
                        selectedStyle === s.id
                          ? 'border-anime-purple-500 bg-anime-purple-600/20'
                          : 'border-anime-border bg-white/5'
                      }`}
                    >
                      <Text className="text-xs font-semibold text-white">
                        {s.emoji} {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Duration selector */}
              <View className="mt-6">
                <Text className="text-sm font-semibold text-white">Duration</Text>
                <View className="mt-3 flex-row gap-3">
                  {(['short', 'long'] as VideoDuration[]).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => { if (!busy) setDuration(d); }}
                      className={`flex-1 items-center rounded-xl border py-3 ${
                        duration === d
                          ? 'border-anime-purple-500 bg-anime-purple-600/20'
                          : 'border-anime-border bg-white/5'
                      }`}
                    >
                      <Text className="text-sm font-semibold text-white capitalize">{d}</Text>
                      <Text className="text-xs text-anime-mute">
                        {d === 'short' ? '~4 seconds' : '~8 seconds'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Generate button */}
              <View className="mt-8">
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGenerate}
                  disabled={busy}
                  className={`items-center rounded-2xl bg-anime-purple-600 py-4 ${busy ? 'opacity-50' : 'active:opacity-80'}`}
                >
                  {generating ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#fff" />
                      <Text className="font-semibold text-white">Generating…</Text>
                    </View>
                  ) : (
                    <Text className="text-base font-semibold text-white">🎬 Generate Video</Text>
                  )}
                </Pressable>
                {status ? (
                  <Text className="mt-3 text-center text-xs text-anime-mute">{status}</Text>
                ) : (
                  <Text className="mt-3 text-center text-xs text-anime-mute">
                    Powered by Replicate · Generation takes 3–5 minutes
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
