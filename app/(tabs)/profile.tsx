import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardCard } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getErrorMessage, showAlert } from '@/lib/alert';
import { formatFirestoreDate, getDisplayName } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-white/5 py-3 last:border-b-0">
      <Text className="text-xs uppercase tracking-wide text-anime-mute">
        {label}
      </Text>
      <Text className="mt-1 text-base text-white" selectable>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      showAlert('Sign out failed', getErrorMessage(error, 'Unable to sign out.'));
    }
  }

  const displayName = getDisplayName({
    displayName: profile?.displayName ?? user?.displayName,
    email: profile?.email ?? user?.email,
  });

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#4c1d95', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 240 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="flex-grow justify-between px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text className="text-3xl font-bold text-white">Profile</Text>
            <Text className="mt-2 text-sm text-anime-mute">
              Your AI Anime Studio account
            </Text>

            <View className="mt-8 items-center">
              <LinearGradient
                colors={['#a78bfa', '#7c3aed', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 88,
                  width: 88,
                  borderRadius: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-3xl font-bold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </Text>
              </LinearGradient>
              <Text className="mt-4 text-xl font-semibold text-white">
                {displayName}
              </Text>
              <View className="mt-2 rounded-full border border-anime-border bg-white/5 px-3 py-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-anime-purple-300">
                  {profile?.subscription ?? 'Free'}
                </Text>
              </View>
            </View>

            <DashboardCard className="mt-8">
              {loading ? (
                <View className="items-center py-6">
                  <ActivityIndicator color="#a78bfa" />
                </View>
              ) : (
                <View>
                  <ProfileRow
                    label="Email"
                    value={profile?.email ?? user?.email ?? '—'}
                  />
                  <ProfileRow
                    label="Display name"
                    value={
                      profile?.displayName?.trim() ||
                      user?.displayName?.trim() ||
                      'Not set'
                    }
                  />
                  <ProfileRow
                    label="Account created"
                    value={formatFirestoreDate(profile?.createdAt)}
                  />
                  <ProfileRow
                    label="Subscription"
                    value={profile?.subscription ?? 'Free'}
                  />
                </View>
              )}
            </DashboardCard>
          </View>

          <View className="mt-10">
            <Button title="Log out" variant="secondary" onPress={handleSignOut} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
