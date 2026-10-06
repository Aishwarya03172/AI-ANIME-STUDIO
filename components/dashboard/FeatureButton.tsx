import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, type PressableProps } from 'react-native';

type FeatureButtonProps = PressableProps & {
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: 'primary' | 'secondary';
};

export function FeatureButton({
  title,
  subtitle,
  icon = '✦',
  variant = 'primary',
  disabled,
  ...props
}: FeatureButtonProps) {
  const content = (
    <View className="flex-row items-center gap-3 px-4 py-4">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
        <Text className="text-lg text-white">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-white">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-white/70">{subtitle}</Text>
        ) : null}
      </View>
      <Text className="text-white/50">›</Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`overflow-hidden rounded-2xl ${disabled ? 'opacity-50' : 'active:opacity-90'}`}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={['#7c3aed', '#6d28d9', '#4c1d95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View className="border border-anime-border bg-white/5">{content}</View>
      )}
    </Pressable>
  );
}
