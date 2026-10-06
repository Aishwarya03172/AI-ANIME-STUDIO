import { Text, View } from 'react-native';

import { DashboardCard } from '@/components/dashboard/DashboardCard';

type EmptyProjectsCardProps = {
  title?: string;
  message?: string;
};

export function EmptyProjectsCard({
  title = 'No projects yet',
  message = 'Your recent anime projects will appear here. Create your first scene to get started.',
}: EmptyProjectsCardProps) {
  return (
    <DashboardCard>
      <View className="items-center py-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full border border-anime-border bg-anime-purple-600/20">
          <Text className="text-2xl text-anime-purple-300">◇</Text>
        </View>
        <Text className="text-base font-semibold text-white">{title}</Text>
        <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-anime-mute">
          {message}
        </Text>
      </View>
    </DashboardCard>
  );
}
