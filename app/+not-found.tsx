import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-2xl font-bold text-white">Screen not found</Text>
        <Link href="/" className="mt-4">
          <Text className="text-brand-400">Go home</Text>
        </Link>
      </View>
    </>
  );
}
