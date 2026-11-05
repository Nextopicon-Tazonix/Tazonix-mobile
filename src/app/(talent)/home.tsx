import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Competition, Opportunity, Wallet } from '@/api/types';
import { Card, EmptyState, GoldDivider, GradientButton, Loading, Row, Screen, SectionHeader, T } from '@/components/ui';
import { CompetitionCard, OpportunityCard } from '@/components/cards';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/store/auth';
import { money } from '@/lib/format';
import { colors, space } from '@/theme';

function Stat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <Card style={{ flex: 1, padding: space.md }}>
      <T variant="small">{label}</T>
      <T variant="h2" style={{ color }}>
        {value}
      </T>
    </Card>
  );
}

export default function TalentHome() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const live = useQuery({ queryKey: ['competitions', 'home'], queryFn: () => api.list<Competition>('/competitions', { limit: 10 }) });
  const opps = useQuery({ queryKey: ['opportunities', 'home'], queryFn: () => api.list<Opportunity>('/opportunities', { limit: 5 }) });
  const points = useQuery({ queryKey: ['points'], queryFn: () => api.get<{ total: number }>('/me/points'), enabled: !!user });
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.get<Wallet>('/me/wallet'), enabled: !!user });
  const balance = wallet.data?.balances[0];

  const active = (live.data?.items ?? []).filter((c) => c.phase !== 'CLOSED');

  return (
    <Screen onRefresh={() => qc.invalidateQueries()} refreshing={live.isRefetching}>
      {user ? (
        <>
          <T variant="h1">Hey, {user.displayName.split(' ')[0]} 👋</T>
          <T variant="muted">Here's what's happening on Tazonix today.</T>
          <Row>
            <Stat label="Points" value={String(points.data?.total ?? 0)} color={colors.amber} />
            <Stat label="Wallet" value={balance ? money(balance.availableMinor, balance.currency) : money(0)} />
          </Row>
          {!user.talentProfile?.headline ? (
            <Card style={{ borderColor: colors.purple, gap: 8 }}>
              <T variant="h3">Complete your profile</T>
              <T variant="muted">Talent with a headline, bio and portfolio get discovered far more often.</T>
              <GradientButton small title="Edit profile" onPress={() => router.push('/profile-edit')} />
            </Card>
          ) : null}
        </>
      ) : (
        <View style={{ gap: space.md }}>
          <Logo size={34} />
          <T variant="tagline">Discover talent. Unlock possibilities.</T>
          <GoldDivider />
          <Card style={{ gap: 10 }}>
            <T variant="h3">You're browsing as a guest</T>
            <T variant="muted">Sign up to vote, enter competitions, and get discovered by agencies worldwide.</T>
            <GradientButton title="Join as Talent" onPress={() => router.push({ pathname: '/sign-up', params: { role: 'TALENT' } })} />
            <GradientButton title="Sign in" variant="outline" onPress={() => router.push('/sign-in')} />
          </Card>
        </View>
      )}

      <SectionHeader title="Live competitions" action="See all" onAction={() => router.push('/competitions')} />
      {live.isLoading ? (
        <Loading />
      ) : active.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
          {active.map((c) => (
            <CompetitionCard key={c.id} competition={c} compact />
          ))}
        </ScrollView>
      ) : (
        <EmptyState title="No live competitions" message="Check back soon or set reminders for upcoming ones." />
      )}

      <SectionHeader title="Opportunities for you" action="See all" onAction={() => router.push('/discover')} />
      {opps.isLoading ? (
        <Loading />
      ) : opps.data?.items.length ? (
        opps.data.items.map((o) => <OpportunityCard key={o.id} opportunity={o} />)
      ) : (
        <EmptyState title="No open opportunities yet" />
      )}
    </Screen>
  );
}
