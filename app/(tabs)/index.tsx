import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    DashboardCard,
    EmptyProjectsCard,
    FeatureButton,
    PremiumBanner,
} from '@/components/dashboard';
import { useRecentProjects } from '@/hooks/useRecentProjects';
import { useUserProfile } from '@/hooks/useUserProfile';
import { showAlert } from '@/lib/alert';
import { getDisplayName } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { projects, loading: projectsLoading } = useRecentProjects();

  const welcomeName = getDisplayName({
    displayName: profile?.displayName ?? user?.displayName,
    email: profile?.email ?? user?.email,
  });

  function comingSoon(feature: string) {
    showAlert(feature, 'This feature is coming in the next phase.');
  }

  return (
    <View className="flex-1 bg-anime-bg">
      <LinearGradient
        colors={['#1a0b2e', '#050508', '#050508']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="px-5 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-semibold uppercase tracking-[0.25em] text-anime-purple-300">
            AI Anime Studio
          </Text>
          <Text className="mt-2 text-3xl font-bold text-white">
            Welcome, {welcomeName}
          </Text>
          <Text className="mt-2 text-sm text-anime-mute">
            {profile?.email ?? user?.email ?? 'Signed in'}
          </Text>

          <View className="mt-8 gap-3">
            <FeatureButton
              title="Create Anime"
              subtitle="Start a new scene or episode"
              icon="✦"
              onPress={() => router.push('/(tabs)/create')}
            />
            <FeatureButton
              title="Generate Video"
              subtitle="Turn prompts into motion"
              icon="▷"
              variant="secondary"
              onPress={() => router.push('/(tabs)/video')}
            />
            <FeatureButton
              title="My Projects"
              subtitle="Browse your studio library"
              icon="▣"
              variant="secondary"
              onPress={() => router.push('/(tabs)/library')}
            />
          </View>

          <View className="mt-6">
            <PremiumBanner onPress={() => comingSoon('Premium')} />
          </View>

          <View className="mt-8">
            <View className="mb-3 flex-row items-end justify-between">
              <Text className="text-lg font-semibold text-white">
                Recent Projects
              </Text>
              <Text
                className="text-sm font-medium text-anime-purple-300"
                onPress={() => router.push('/(tabs)/library')}
              >
                See all
              </Text>
            </View>

            {profileLoading || projectsLoading ? (
              <DashboardCard>
                <View className="items-center py-8">
                  <ActivityIndicator color="#a78bfa" />
                </View>
              </DashboardCard>
            ) : projects.length === 0 ? (
              <EmptyProjectsCard />
            ) : (
              <View className="gap-3">
                {projects.map((project) => (
                  <DashboardCard key={project.id}>
                    <Text className="text-base font-semibold text-white">
                      {project.title}
                    </Text>
                    <Text className="mt-1 text-sm capitalize text-anime-mute">
                      {project.status}
                    </Text>
                  </DashboardCard>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
