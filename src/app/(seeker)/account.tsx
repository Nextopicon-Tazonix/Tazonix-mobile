import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, Bell, Briefcase, CreditCard, Settings, Trophy, User, Wallet } from 'lucide-react-native';
import { Avatar, Card, GradientButton, MenuItem, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { signOut } from '@/lib/session';
import { titleCase } from '@/lib/format';
import { colors } from '@/theme';

export default function Account() {
  const user = useAuth((s) => s.user);
  if (!user) return <SignInPrompt />;
  const org = user.orgProfile;

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <Avatar uri={user.avatarUrl} name={org?.orgName || user.displayName} size={80} />
        <Row gap={6}>
          <T variant="h2">{org?.orgName || user.displayName}</T>
          {org?.verified ? <BadgeCheck color={colors.blue} size={18} /> : null}
        </Row>
        {org?.orgType ? <T variant="muted">{org.orgType}</T> : null}
        <Row>
          <Tag label={titleCase(user.status)} color={user.status === 'ACTIVE' ? colors.success : colors.amber} />
          <Tag label={user.subscription?.planName ?? 'Free plan'} color={colors.amber} />
        </Row>
        <GradientButton small title="Edit organization" onPress={() => router.push('/org-edit')} />
      </Card>
      <View>
        <MenuItem icon={CreditCard} title="Plans & subscription" subtitle={user.subscription ? `${user.subscription.planName} · ${titleCase(user.subscription.status)}` : 'Upgrade to contact talent'} onPress={() => router.push('/plans')} />
        <MenuItem icon={Briefcase} title="My opportunities" subtitle="Applications and hiring" onPress={() => router.push('/my-opportunities')} />
        <MenuItem icon={Trophy} title="My competitions" onPress={() => router.push('/my-competitions')} />
        <MenuItem icon={Wallet} title="Wallet" onPress={() => router.push('/wallet')} />
        <MenuItem icon={Bell} title="Notifications" onPress={() => router.push('/notifications')} />
        <MenuItem icon={Settings} title="Settings" onPress={() => router.push('/settings')} />
        {user.roles.includes('TALENT') ? <MenuItem icon={User} title="Switch to talent view" onPress={() => router.replace('/home')} /> : null}
      </View>
      <GradientButton
        title="Sign out"
        variant="ghost"
        onPress={async () => {
          await signOut();
          router.replace('/welcome');
        }}
      />
    </Screen>
  );
}
