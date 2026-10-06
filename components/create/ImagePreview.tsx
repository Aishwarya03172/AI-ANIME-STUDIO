import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type ImagePreviewProps = {
  uri: string;
  onChangePress?: () => void;
  onClearPress?: () => void;
};

export function ImagePreview({
  uri,
  onChangePress,
  onClearPress,
}: ImagePreviewProps) {
  return (
    <Animated.View entering={FadeIn.duration(350)} className="overflow-hidden rounded-3xl border border-anime-border bg-white/5">
      <Image
        source={{ uri }}
        className="h-72 w-full"
        resizeMode="cover"
        accessibilityLabel="Selected photo preview"
      />
      <View className="flex-row gap-3 p-4">
        {onChangePress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onChangePress}
            className="flex-1 items-center rounded-2xl bg-anime-purple-600/30 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-anime-purple-300">Change</Text>
          </Pressable>
        ) : null}
        {onClearPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClearPress}
            className="flex-1 items-center rounded-2xl bg-white/10 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
