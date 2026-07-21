import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign out.';
      Alert.alert('Sign out failed', message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 justify-between px-6 pt-8 pb-6">
        <View>
          <Text className="text-3xl font-bold text-white">Profile</Text>
          <Text className="mt-3 text-base text-zinc-400">
            Manage your AI Anime Studio account.
          </Text>

          <View className="mt-8 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <Text className="text-sm uppercase tracking-wide text-zinc-500">
              Email
            </Text>
            <Text className="text-base text-white">{user?.email ?? '—'}</Text>
            <Text className="mt-4 text-sm uppercase tracking-wide text-zinc-500">
              User ID
            </Text>
            <Text className="text-base text-zinc-300" selectable>
              {user?.uid ?? '—'}
            </Text>
          </View>
        </View>

        <Button title="Sign out" variant="secondary" onPress={handleSignOut} />
      </View>
    </SafeAreaView>
  );
}
