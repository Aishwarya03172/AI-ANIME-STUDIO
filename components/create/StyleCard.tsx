import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AnimeStyleOption } from '@/types/animeStyle';

type StyleCardProps = {
  styleOption: AnimeStyleOption;
  selected: boolean;
  onPress: () => void;
  index?: number;
};

export function StyleCard({
  styleOption,
  selected,
  onPress,
  index = 0,
}: StyleCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(350)}
      className="w-[48%]"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        className={`rounded-2xl border p-4 active:opacity-90 ${
          selected
            ? 'border-anime-purple-400 bg-anime-purple-600/25'
            : 'border-white/10 bg-white/5'
        }`}
      >
        <View
          className="mb-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${styleOption.accent}22` }}
        >
          <Text className="text-lg" style={{ color: styleOption.accent }}>
            {styleOption.emoji}
          </Text>
        </View>
        <Text className="text-base font-semibold text-white">
          {styleOption.label}
        </Text>
        <Text className="mt-1 text-xs leading-4 text-anime-mute">
          {styleOption.description}
        </Text>
        {selected ? (
          <Text className="mt-3 text-xs font-semibold uppercase tracking-wide text-anime-purple-300">
            Selected
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
