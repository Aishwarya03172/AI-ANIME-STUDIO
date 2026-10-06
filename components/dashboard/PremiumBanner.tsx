import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

type PremiumBannerProps = {
  onPress?: () => void;
};

export function PremiumBanner({ onPress }: PremiumBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="overflow-hidden rounded-3xl active:opacity-90"
    >
      <LinearGradient
        colors={['#4c1d95', '#7c3aed', '#db2777']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 1, borderRadius: 24 }}
      >
        <View className="rounded-[23px] bg-[#0b0614]/90 p-5">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-anime-purple-300">
            Premium
          </Text>
          <Text className="mt-2 text-xl font-bold text-white">
            Unlock cinematic anime power
          </Text>
          <Text className="mt-2 text-sm leading-5 text-white/70">
            Higher resolution exports, priority generation, and exclusive styles.
          </Text>
          <View className="mt-4 self-start rounded-full bg-white/15 px-4 py-2">
            <Text className="text-sm font-semibold text-white">Upgrade soon</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
