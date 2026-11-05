import React from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Competition, Opportunity, TalentCard as Talent } from '@/api/types';
import { Card, EmptyState, GradientButton, Loading, Row, Screen, SectionHeader, T } from '@/components/ui';
import { CompetitionCard, OpportunityCard, TalentCard } from '@/components/cards';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date } from '@/lib/format';
import { colors, space } from '@/theme';

export default function SeekerDashboard() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const talent = useQuery({ queryKey: ['discover', 'featured'], queryFn: () => api.list<Talent>('/discover/talent', { limit: 5 }) });
  const myOpps = useQuery({ queryKey: ['my-opportunities'], queryFn: () => api.list<Opportunity>('/me/opportunities'), enabled: !!user });
  const comps = useQuery({ queryKey: ['competitions', 'dashboard'], queryFn: () => api.list<Competition>('/competitions', { limit: 6 }) });
  if (!user) return <SignInPrompt />;
  const sub = user.subscription;
  const ent = user.entitlements;

  return (
    <Screen onRefresh={() => qc.invalidateQueries()} refreshing={talent.isRefetching}>
      <T variant="h1">Hey, {user.orgProfile?.orgName || user.displayName.split(' ')[0]}</T>
      <Card style={{ gap: 6, borderColor: sub?.status === 'ACTIVE' ? colors.amber : colors.border }}>
        <T variant="small">Your plan</T>
        <T variant="h2" style={{ color: colors.amber }}>
          {sub ? sub.planName : 'Free'}
        </T>
        <T variant="muted">
          {sub ? `${sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${date(sub.currentPeriodEnd)}` : 'Upgrade to contact talent, post opportunities and run competitions.'}
        </T>
        <T variant="small">
          AI matches: {ent.aiMatchesUsed}/{ent.aiMatchesPerMonth} this month
        </T>
        {!ent.contactTalent ? <GradientButton small title="See plans" onPress={() => router.push('/plans')} /> : null}
      </Card>

      <Card onPress={() => router.push('/ai-match')} style={{ borderColor: colors.purple }}>
        <Row gap={12}>
          <Sparkles color={colors.magenta} size={28} />
          <Row style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }} gap={2}>
            <T variant="h3">AI Match</T>
            <T variant="muted">Describe who you need. We'll find and explain the best fits.</T>
          </Row>
        </Row>
      </Card>

      <Row>
        <GradientButton small title="Post opportunity" style={{ flex: 1 }} onPress={() => router.push('/opportunity/new')} />
        <GradientButton small title="Create competition" variant="outline" style={{ flex: 1 }} onPress={() => router.push('/competition/new')} />
      </Row>

      <SectionHeader title="Featured talent" action="Discover" onAction={() => router.push('/find-talent')} />
      {talent.isLoading ? <Loading /> : (talent.data?.items ?? []).map((t) => <TalentCard key={t.id} talent={t} />)}

      <SectionHeader title="Your opportunities" action="Manage" onAction={() => router.push('/my-opportunities')} />
      {myOpps.data?.items.length ? (
        myOpps.data.items.slice(0, 3).map((o) => <OpportunityCard key={o.id} opportunity={o} />)
      ) : (
        <EmptyState title="No opportunities posted" message="Post auditions, gigs and casting calls to receive applications." />
      )}

      <SectionHeader title="Competitions" action="My competitions" onAction={() => router.push('/my-competitions')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
        {(comps.data?.items ?? []).map((c) => (
          <CompetitionCard key={c.id} competition={c} compact />
        ))}
      </ScrollView>
    </Screen>
  );
}
