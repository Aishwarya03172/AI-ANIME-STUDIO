import { ActivityIndicator, Text, View } from 'react-native';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <ActivityIndicator size="large" color="#ea580c" />
      <Text className="mt-4 text-base text-zinc-400">{message}</Text>
    </View>
  );
}
