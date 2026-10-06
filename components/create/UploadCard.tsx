import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type UploadCardProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function UploadCard({ onPress, disabled }: UploadCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Upload photo"
        disabled={disabled}
        onPress={onPress}
        className={`overflow-hidden rounded-3xl active:opacity-90 ${disabled ? 'opacity-60' : ''}`}
      >
        <LinearGradient
          colors={['#7c3aed', '#4c1d95', '#1e1b4b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 1, borderRadius: 24 }}
        >
          <View className="min-h-[220px] items-center justify-center rounded-[23px] bg-[#0b0614]/92 px-6 py-10">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-anime-border bg-anime-purple-600/25">
              <Text className="text-3xl text-anime-purple-300">↑</Text>
            </View>
            <Text className="text-xl font-bold text-white">Upload Photo</Text>
            <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-anime-mute">
              Choose a portrait or scene from your gallery to transform into anime.
            </Text>
            <View className="mt-6 rounded-full bg-white/10 px-4 py-2">
              <Text className="text-sm font-semibold text-anime-purple-300">
                Browse gallery
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
