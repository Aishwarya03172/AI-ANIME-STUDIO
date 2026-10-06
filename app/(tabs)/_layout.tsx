import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/providers/AuthProvider';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

function TabLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const tint = Colors.dark.tint;
  const inactive = Colors.dark.tabIconDefault;

  if (loading) {
    return <LoadingScreen message="Opening your studio…" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: '#050508',
          borderTopColor: 'rgba(167,139,250,0.2)',
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={String(color)} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label="Home" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => (
            <TabIcon name="sparkles" color={String(color)} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label="Create" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          title: 'Video',
          tabBarIcon: ({ color }) => (
            <TabIcon name="film-outline" color={String(color)} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label="Video" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => (
            <TabIcon name="film" color={String(color)} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label="Library" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="person" color={String(color)} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label="Profile" color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
