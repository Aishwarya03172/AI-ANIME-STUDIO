import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';

export default function StudioScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
          AI Anime Studio
        </Text>
        <Text className="mt-2 text-3xl font-bold text-white">Your studio</Text>
        <Text className="mt-3 text-base leading-6 text-zinc-400">
          Signed in as {user?.email}. Project scaffolding is ready — Expo Router,
          Firebase Auth, and NativeWind are wired up.
        </Text>

        <View className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <Text className="text-lg font-semibold text-white">Next steps</Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-400">
            Add your Firebase keys to `.env`, enable Email/Password auth in the
            Firebase console, then start building generation flows under
            `services/` and UI under `components/`.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
