import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type GenerateButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
};

export function GenerateButton({
  onPress,
  disabled,
  loading,
  label = 'Generate Anime',
}: GenerateButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`overflow-hidden rounded-2xl ${isDisabled ? 'opacity-45' : 'active:opacity-90'}`}
    >
      <LinearGradient
        colors={['#c026d3', '#7c3aed', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="min-h-[56px] items-center justify-center px-4 py-4">
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold tracking-wide text-white">
              {label}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
