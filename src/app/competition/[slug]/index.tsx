import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Flag, Lock, Trophy } from 'lucide-react-native';
import { absoluteUrl, api } from '@/api/client';
import type { Competition, EntryCard as Entry } from '@/api/types';
import { Card, EmptyState, ErrorView, GradientButton, Input, Loading, Row, Screen, Segmented, T, Tag } from '@/components/ui';
import { EntryCard } from '@/components/cards';
import { useAuth } from '@/store/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { countdown, dateTime, money, phaseLabel } from '@/lib/format';
import { notify, showError } from '@/lib/notify';
import { colors, gradient, radius, space } from '@/theme';

function Timeline({ c }: { c: Competition }) {
  const steps = [
    { label: 'Opens', at: c.startsAt, active: c.phase === 'UPCOMING' },
    { label: 'Submissions close', at: c.submissionEndsAt, active: c.phase === 'SUBMISSIONS_OPEN' },
    { label: 'Voting ends', at: c.votingEndsAt, active: c.phase === 'VOTING' },
  ];
  return (
    <Card style={{ gap: 8 }}>
      {steps.map((s) => (
        <Row key={s.label} style={{ justifyContent: 'space-between' }}>
          <T style={{ color: s.active ? colors.amber : colors.textMuted, fontFamily: s.active ? 'Montserrat_700Bold' : 'Montserrat_400Regular' }}>
            {s.label}
          </T>
          <T variant="small">{dateTime(s.at)}</T>
        </Row>
      ))}
    </Card>
  );
}

export default function CompetitionDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const user = useAuth((s) => s.user);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const [sort, setSort] = useState<'recent' | 'votes'>('votes');
  const [pin, setPin] = useState('');

  const q = useQuery({ queryKey: ['competition', slug], queryFn: () => api.get<Competition>(`/competitions/${slug}`) });
  const c = q.data;
  const entries = useQuery({
    queryKey: ['competition-entries', c?.id, sort],
    queryFn: () => api.list<Entry>(sort === 'votes' ? `/competitions/${c!.id}/leaderboard` : `/competitions/${c!.id}/entries`, sort === 'recent' ? { sort } : undefined),
    enabled: !!c && c.hasAccess !== false,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['competition', slug] });
    qc.invalidateQueries({ queryKey: ['competition-entries'] });
  };

  const access = useMutation({
    mutationFn: () => api.post(`/competitions/${c!.id}/access`, { pin: pin.trim() }),
    onSuccess: refresh,
    onError: (e) => showError(e, 'Incorrect PIN'),
  });
  const reminder = useMutation({
    mutationFn: () => (c!.reminderSet ? api.del(`/competitions/${c!.id}/reminder`) : api.post(`/competitions/${c!.id}/reminder`)),
    onSuccess: () => {
      if (!c!.reminderSet) notify('Reminder set', "We'll remind you before key deadlines.");
      refresh();
    },
    onError: (e) => showError(e),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !c) return <ErrorView error={q.error} onRetry={q.refetch} />;

  const sponsor = absoluteUrl(c.sponsorImageUrl);
  const isTalent = !!user?.roles.includes('TALENT');
  const locked = c.visibility !== 'PUBLIC' && !c.hasAccess;
  const winner = c.status === 'WINNER_CONFIRMED' ? entries.data?.items.find((e) => e.isWinner) : undefined;

  return (
    <Screen onRefresh={refresh} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: c.title }} />
      {sponsor ? (
        <Image source={{ uri: sponsor }} style={{ width: '100%', height: 180, borderRadius: radius.lg }} contentFit="cover" />
      ) : (
        <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 140, borderRadius: radius.lg, padding: space.lg, justifyContent: 'flex-end' }}>
          <Trophy color="#fff" size={36} />
        </LinearGradient>
      )}
      <Row style={{ flexWrap: 'wrap' }}>
        <Tag label={phaseLabel[c.phase]} color={colors.amber} />
        <Tag label={c.genre?.name ?? 'Open'} color={colors.purple} />
        {c.visibility !== 'PUBLIC' ? <Tag label={c.visibility === 'PRIVATE' ? 'Private' : 'Semi-private'} /> : null}
        {c.status === 'WINNER_CONFIRMED' ? <Tag label="Winner announced" color={colors.success} /> : null}
      </Row>
      <T variant="h1">{c.title}</T>
      <T variant="small">
        by {c.organizer.displayName} · {c.entryCount} entries
        {c.phase !== 'CLOSED' ? ` · ${countdown(c.phase === 'UPCOMING' ? c.startsAt : c.phase === 'SUBMISSIONS_OPEN' ? c.submissionEndsAt : c.votingEndsAt)}` : ''}
      </T>

      {c.rewardAmountMinor > 0 || c.prizeDescription ? (
        <Card style={{ borderColor: colors.amber }}>
          <T variant="small">Prize</T>
          {c.rewardAmountMinor > 0 ? (
            <T variant="h2" style={{ color: colors.amber }}>
              {money(c.rewardAmountMinor, c.rewardCurrency)}
            </T>
          ) : null}
          {c.prizeDescription ? <T variant="muted">{c.prizeDescription}</T> : null}
        </Card>
      ) : null}

      {winner ? (
        <Card onPress={() => router.push(`/entry/${winner.id}`)} style={{ borderColor: colors.amber, gap: 4 }}>
          <Row gap={8}>
            <Trophy color={colors.amber} size={20} />
            <T variant="h3">Winner: {winner.account.displayName}</T>
          </Row>
          <T variant="muted">
            “{winner.title}” · {winner.voteCount} votes
          </T>
        </Card>
      ) : null}

      {locked ? (
        <Card style={{ gap: 8 }}>
          <Row gap={8}>
            <Lock color={colors.amber} size={18} />
            <T variant="h3">PIN required</T>
          </Row>
          <T variant="muted">This competition is {c.visibility === 'PRIVATE' ? 'private' : 'semi-private'}. Enter the PIN from the organizer.</T>
          <Input placeholder="Competition PIN" value={pin} onChangeText={setPin} autoCapitalize="characters" />
          <GradientButton title="Unlock" loading={access.isPending} disabled={!pin} onPress={() => requireAuth(() => access.mutate(), { requireActive: false })} />
        </Card>
      ) : null}

      <View style={{ gap: space.sm }}>
        {c.phase === 'SUBMISSIONS_OPEN' && (isTalent || !user) && !locked ? (
          c.myEntryId ? (
            <GradientButton title="View my entry" variant="outline" onPress={() => router.push(`/entry/${c.myEntryId}`)} />
          ) : (
            <GradientButton title="Enter competition" onPress={() => requireAuth(() => router.push(`/competition/${c.slug}/enter`))} />
          )
        ) : null}
        {c.phase === 'VOTING' && c.myVoteEntryId ? (
          <GradientButton title="See the entry you voted for" variant="ghost" onPress={() => router.push(`/entry/${c.myVoteEntryId}`)} />
        ) : null}
        {c.phase !== 'CLOSED' ? (
          <GradientButton
            variant="ghost"
            title={c.reminderSet ? 'Reminder on' : 'Remind me'}
            icon={c.reminderSet ? <BellOff color={colors.text} size={18} /> : <Bell color={colors.text} size={18} />}
            loading={reminder.isPending}
            onPress={() => requireAuth(() => reminder.mutate(), { requireActive: false })}
          />
        ) : null}
      </View>

      <Timeline c={c} />

      {c.description ? (
        <Card>
          <T variant="h3" style={{ marginBottom: 6 }}>
            About
          </T>
          <T variant="muted">{c.description}</T>
        </Card>
      ) : null}
      {c.rules ? (
        <Card>
          <T variant="h3" style={{ marginBottom: 6 }}>
            Rules
          </T>
          <T variant="muted">{c.rules}</T>
          <T variant="small" style={{ marginTop: 8 }}>
            Accepted media: {c.acceptedMedia.join(', ').toLowerCase() || 'video'}
            {c.maxDurationSec ? ` · max ${Math.round(c.maxDurationSec / 60)} min` : ''} · One vote per account per competition.
          </T>
        </Card>
      ) : null}
      {c.website ? (
        <T style={{ color: colors.blue }} onPress={() => Linking.openURL(c.website!.startsWith('http') ? c.website! : `https://${c.website}`)}>
          {c.website}
        </T>
      ) : null}

      {!locked ? (
        <>
          <Segmented
            value={sort}
            onChange={setSort}
            options={[
              { value: 'votes', label: 'Leaderboard' },
              { value: 'recent', label: 'Newest' },
            ]}
          />
          {entries.isLoading ? (
            <Loading />
          ) : entries.error ? (
            <ErrorView error={entries.error} onRetry={entries.refetch} />
          ) : !entries.data?.items.length ? (
            <EmptyState title="No entries yet" message={c.phase === 'SUBMISSIONS_OPEN' ? 'Be the first to enter!' : undefined} />
          ) : (
            entries.data.items.map((e, i) => <EntryCard key={e.id} entry={e} rank={sort === 'votes' ? i + 1 : undefined} />)
          )}
        </>
      ) : null}

      <Pressable
        style={{ alignSelf: 'center', marginTop: space.lg }}
        onPress={() => requireAuth(() => router.push({ pathname: '/report', params: { targetType: 'COMPETITION', targetId: c.id } }), { requireActive: false })}
      >
        <Row gap={6}>
          <Flag color={colors.textFaint} size={14} />
          <T variant="small">Report this competition</T>
        </Row>
      </Pressable>
    </Screen>
  );
}
