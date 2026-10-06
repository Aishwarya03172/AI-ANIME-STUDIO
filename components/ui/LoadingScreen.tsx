import { ActivityIndicator, Text, View } from 'react-native';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-anime-bg">
      <ActivityIndicator size="large" color="#a78bfa" />
      <Text className="mt-4 text-base text-anime-mute">{message}</Text>
    </View>
  );
}
