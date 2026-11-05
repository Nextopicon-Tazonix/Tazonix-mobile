import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, Briefcase, Coins, Film, Settings, Trophy, Wallet as WalletIcon, Bell } from 'lucide-react-native';
import { Avatar, Card, GradientButton, MenuItem, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { useGenres } from '@/api/hooks';
import { signOut } from '@/lib/session';
import { colors } from '@/theme';
import { titleCase } from '@/lib/format';

export default function Profile() {
  const user = useAuth((s) => s.user);
  const genres = useGenres();
  if (!user) return <SignInPrompt title="Your profile" message="Sign in to build your talent profile and get discovered." />;
  const tp = user.talentProfile;
  const myGenres = (genres.data ?? []).filter((g) => tp?.genreIds.includes(g.id));

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <Avatar uri={user.avatarUrl} name={user.displayName} size={84} />
        <Row gap={6}>
          <T variant="h2">{user.displayName}</T>
        </Row>
        <T variant="small">@{user.handle}</T>
        {tp?.headline ? (
          <T variant="muted" style={{ textAlign: 'center' }}>
            {tp.headline}
          </T>
        ) : null}
        <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {myGenres.map((g) => (
            <Tag key={g.id} label={g.name} />
          ))}
          <Tag label={titleCase(user.status)} color={user.status === 'ACTIVE' ? colors.success : colors.amber} />
        </Row>
        <Row style={{ marginTop: 8 }}>
          <GradientButton small title="Edit profile" onPress={() => router.push('/profile-edit')} />
          <GradientButton small title="View public" variant="outline" onPress={() => router.push(`/talent/${user.handle}`)} />
        </Row>
      </Card>

      <View>
        <MenuItem icon={WalletIcon} title="Wallet" subtitle="Rewards, balance and payouts" onPress={() => router.push('/wallet')} />
        <MenuItem icon={Coins} title="Points" subtitle="Engagement points (not cash)" onPress={() => router.push('/points')} />
        <MenuItem icon={Film} title="My entries" onPress={() => router.push('/my-entries')} />
        <MenuItem icon={Briefcase} title="My applications" onPress={() => router.push('/my-applications')} />
        <MenuItem icon={Trophy} title="Competitions" onPress={() => router.push('/competitions')} />
        <MenuItem icon={Bell} title="Notifications" onPress={() => router.push('/notifications')} />
        <MenuItem icon={Settings} title="Settings" subtitle="Account, privacy, delete account" onPress={() => router.push('/settings')} />
        {user.roles.includes('SEEKER') ? (
          <MenuItem icon={BadgeCheck} title="Switch to seeker dashboard" onPress={() => router.replace('/dashboard')} />
        ) : null}
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
