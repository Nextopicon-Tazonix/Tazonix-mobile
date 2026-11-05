import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Notification } from '@/api/types';
import { useAuth } from '@/store/auth';
import { colors, fonts } from '@/theme';

export interface TabDef {
  name: string;
  title: string;
  icon: LucideIcon;
}

function NotificationBell() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unread = data?.some((n) => !n.readAt);
  if (!user) return null;
  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={10} style={{ marginRight: 16 }} accessibilityLabel="Notifications">
      <Bell color={unread ? colors.amber : colors.text} size={22} fill={unread ? colors.amber : 'transparent'} />
    </Pressable>
  );
}

export function TabsLayout({ tabs }: { tabs: TabDef[] }) {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        headerRight: () => <NotificationBell />,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tabs.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, size }) => <Icon color={color} size={size} /> }} />
      ))}
    </Tabs>
  );
}
