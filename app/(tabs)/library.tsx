import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyProjectsCard } from '@/components/dashboard';
import { useGenerations } from '@/hooks/useGenerations';
import { formatFirestoreDate } from '@/lib/format';
import type { Generation } from '@/types/generation';

const GAP = 12;
const H_PADDING = 20;
const CARD_WIDTH =
  (Dimensions.get('window').width - H_PADDING * 2 - GAP) / 2;

function GenerationCard({
  item,
  onPress,
}: {
  item: Generation;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="overflow-hidden rounded-2xl border border-anime-border bg-white/5 active:opacity-90"
      style={{ width: CARD_WIDTH, marginBottom: GAP }}
    >
      <Image
        source={{ uri: item.generatedImage }}
        style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.15 }}
        resizeMode="cover"
      />
      <View className="gap-1 p-3">
        <Text className="text-sm font-semibold text-white" numberOfLines={1}>
          {item.animeStyle}
        </Text>
        <Text className="text-xs text-anime-mute">
          {formatFirestoreDate(item.createdAt)}
        </Text>
        <Text className="text-[10px] font-semibold uppercase tracking-wide text-anime-purple-300">
          {item.quality}
        </Text>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { generations, loading, error } = useGenerations();

  function openGeneration(item: Generation) {
    router.push({
      pathname: '/preview',
      params: {
        generationId: item.id,
        imageUri: item.originalImage,
        generatedImageUrl: item.generatedImage,
        animeStyle: item.animeStyle,
        quality: item.quality,
        createdAt: item.createdAt?.toMillis?.()
          ? String(item.createdAt.toMillis())
          : '',
      },
    });
  }

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#1e1b4b', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 px-5 pt-4">
          <Text className="text-3xl font-bold text-white">Library</Text>
          <Text className="mt-2 text-sm leading-5 text-anime-mute">
            Your anime generation history.
          </Text>

          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator color="#a78bfa" size="large" />
            </View>
          ) : error ? (
            <View className="mt-8">
              <EmptyProjectsCard
                title="Couldn't load library"
                message={error}
              />
            </View>
          ) : generations.length === 0 ? (
            <View className="mt-8">
              <EmptyProjectsCard
                title="No generations yet"
                message="Create your first anime image and it will show up here automatically."
              />
            </View>
          ) : (
            <FlatList
              className="mt-6"
              data={generations}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <GenerationCard
                  item={item}
                  onPress={() => openGeneration(item)}
                />
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
