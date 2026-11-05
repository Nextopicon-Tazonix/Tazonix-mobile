import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Heart, MapPin, MessageCircle, Trophy, Vote } from 'lucide-react-native';
import { absoluteUrl } from '@/api/client';
import type { Competition, EntryCard as Entry, Opportunity, TalentCard as Talent } from '@/api/types';
import { colors, gradient, radius, space } from '@/theme';
import { countdown, money, phaseLabel, titleCase, date } from '@/lib/format';
import { Avatar, Card, Row, T, Tag } from './ui';
import { MediaThumb } from './MediaView';

const phaseColor = { UPCOMING: colors.blue, SUBMISSIONS_OPEN: colors.amber, VOTING: colors.magenta, CLOSED: colors.textFaint } as const;

export function TalentCard({ talent, right }: { talent: Talent; right?: React.ReactNode }) {
  return (
    <Card onPress={() => router.push(`/talent/${talent.handle}`)}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <Avatar uri={talent.avatarUrl} name={talent.displayName} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <T variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {talent.displayName}
            </T>
            {talent.verified ? <BadgeCheck color={colors.blue} size={16} /> : null}
          </Row>
          {talent.headline ? (
            <T variant="muted" numberOfLines={2}>
              {talent.headline}
            </T>
          ) : null}
          <Row gap={12} style={{ marginTop: 4, flexWrap: 'wrap' }}>
            {talent.city || talent.country ? (
              <Row gap={4}>
                <MapPin color={colors.textFaint} size={13} />
                <T variant="small">{[talent.city, talent.country].filter(Boolean).join(', ')}</T>
              </Row>
            ) : null}
            {talent.wins > 0 ? (
              <Row gap={4}>
                <Trophy color={colors.amber} size={13} />
                <T variant="small" style={{ color: colors.amber }}>
                  {talent.wins} win{talent.wins > 1 ? 's' : ''}
                </T>
              </Row>
            ) : null}
            <T variant="small" style={{ color: talent.isAvailable ? colors.success : colors.textFaint }}>
              {talent.isAvailable ? '● Available' : '○ Unavailable'}
            </T>
          </Row>
          <Row gap={6} style={{ flexWrap: 'wrap', marginTop: 6 }}>
            {talent.genres.slice(0, 3).map((g) => (
              <Tag key={g.id} label={g.name} />
            ))}
          </Row>
        </View>
        {right}
      </Row>
    </Card>
  );
}

export function CompetitionCard({ competition: c, compact }: { competition: Competition; compact?: boolean }) {
  const sponsor = absoluteUrl(c.sponsorImageUrl);
  const deadline = c.phase === 'UPCOMING' ? c.startsAt : c.phase === 'SUBMISSIONS_OPEN' ? c.submissionEndsAt : c.votingEndsAt;
  return (
    <Card onPress={() => router.push(`/competition/${c.slug}`)} style={[{ padding: 0, overflow: 'hidden' }, compact && { width: 260 }]}>
      {sponsor ? (
        <Image source={{ uri: sponsor }} style={{ height: compact ? 110 : 140, width: '100%' }} contentFit="cover" />
      ) : (
        <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: compact ? 110 : 140, justifyContent: 'flex-end', padding: space.md }}>
          <Trophy color={colors.text} size={32} />
        </LinearGradient>
      )}
      <View style={{ padding: space.md, gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Tag label={phaseLabel[c.phase]} color={phaseColor[c.phase]} />
          {c.visibility !== 'PUBLIC' ? <Tag label="Private" /> : null}
        </Row>
        <T variant="h3" numberOfLines={2}>
          {c.title}
        </T>
        <T variant="small">
          {c.genre?.name} · {c.entryCount} entries {c.phase !== 'CLOSED' ? `· ${countdown(deadline)}` : `· ended ${date(c.votingEndsAt)}`}
        </T>
        {c.rewardAmountMinor > 0 || c.prizeDescription ? (
          <T style={{ color: colors.amber, fontFamily: 'Montserrat_700Bold' }} numberOfLines={1}>
            🏆 {c.rewardAmountMinor > 0 ? money(c.rewardAmountMinor, c.rewardCurrency) : c.prizeDescription}
          </T>
        ) : null}
      </View>
    </Card>
  );
}

export function EntryCard({ entry: e, rank }: { entry: Entry; rank?: number }) {
  return (
    <Card onPress={() => router.push(`/entry/${e.id}`)} style={{ padding: 0, overflow: 'hidden' }}>
      <MediaThumb media={e.media} height={150} />
      {e.isWinner ? (
        <View style={styles.winner}>
          <Trophy color={colors.navy} size={14} />
          <T style={{ color: colors.navy, fontFamily: 'Montserrat_700Bold', fontSize: 12 }}>Winner</T>
        </View>
      ) : null}
      <View style={{ padding: space.md, gap: 6 }}>
        <Row>
          {rank ? <T style={{ color: colors.amber, fontFamily: 'Montserrat_800ExtraBold' }}>#{rank}</T> : null}
          <T variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {e.title}
          </T>
        </Row>
        <Row gap={6}>
          <Avatar uri={e.account.avatarUrl} name={e.account.displayName} size={20} />
          <T variant="small" numberOfLines={1} style={{ flex: 1 }}>
            {e.account.displayName} · {e.competition.title}
          </T>
        </Row>
        <Row gap={16}>
          <Row gap={4}>
            <Vote color={e.votedByMe ? colors.amber : colors.textMuted} size={14} />
            <T variant="small">{e.voteCount}</T>
          </Row>
          <Row gap={4}>
            <Heart color={e.likedByMe ? colors.magenta : colors.textMuted} size={14} />
            <T variant="small">{e.likeCount}</T>
          </Row>
          <Row gap={4}>
            <MessageCircle color={colors.textMuted} size={14} />
            <T variant="small">{e.commentCount}</T>
          </Row>
        </Row>
      </View>
    </Card>
  );
}

export function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  return (
    <Card onPress={() => router.push(`/opportunity/${o.id}`)} style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Tag label={titleCase(o.type)} color={colors.purple} />
        {o.closed ? <Tag label="Closed" /> : o.myApplicationStatus ? <Tag label={titleCase(o.myApplicationStatus)} color={colors.success} /> : null}
      </Row>
      <T variant="h3" numberOfLines={2}>
        {o.title}
      </T>
      <T variant="muted" numberOfLines={2}>
        {o.description}
      </T>
      <T variant="small">
        {o.owner.displayName} · {o.remote ? 'Remote' : [o.city, o.country].filter(Boolean).join(', ') || 'Anywhere'}
        {o.deadline ? ` · apply by ${date(o.deadline)}` : ''}
      </T>
      {o.compensation ? <T style={{ color: colors.amber, fontFamily: 'Montserrat_600SemiBold' }}>{o.compensation}</T> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  winner: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
