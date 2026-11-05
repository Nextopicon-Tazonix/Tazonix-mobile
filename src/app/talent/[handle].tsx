import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Bookmark, BookmarkCheck, Flag, Lock, MapPin, Trophy } from 'lucide-react-native';
import { api } from '@/api/client';
import type { TalentPublic } from '@/api/types';
import { Avatar, Card, EmptyState, ErrorView, GradientButton, Loading, Row, Screen, SectionHeader, T, Tag } from '@/components/ui';
import { EntryCard } from '@/components/cards';
import { MediaThumb } from '@/components/MediaView';
import { useAuth } from '@/store/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { showError } from '@/lib/notify';
import { colors, space } from '@/theme';

export default function TalentProfile() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const user = useAuth((s) => s.user);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['talent', handle], queryFn: () => api.get<TalentPublic>(`/talent/${handle}`) });

  const toggleShortlist = useMutation({
    mutationFn: (t: TalentPublic) => (t.shortlisted ? api.del(`/shortlist/${t.id}`) : api.post('/shortlist', { talentId: t.id })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['talent', handle] });
      qc.invalidateQueries({ queryKey: ['shortlist'] });
    },
    onError: (e) => showError(e),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const t = q.data;
  const isSelf = user?.id === t.id;
  const isSeekerUser = !!user?.roles.includes('SEEKER');

  const contact = (kind: 'invite' | 'book') =>
    requireAuth(() => {
      if (!user?.entitlements.contactTalent) return router.push({ pathname: '/plans', params: { reason: 'contact' } });
      if (kind === 'invite') router.push({ pathname: '/invitation/new', params: { talentId: t.id, name: t.displayName } });
      else router.push({ pathname: '/booking/new', params: { talentId: t.id, name: t.displayName } });
    });

  const social = Object.entries(t.social ?? {}).filter(([, v]) => !!v) as [string, string][];

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: t.displayName }} />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Avatar uri={t.avatarUrl} name={t.displayName} size={96} />
        <Row gap={6}>
          <T variant="h1">{t.displayName}</T>
          {t.verified ? <BadgeCheck color={colors.blue} size={22} /> : null}
        </Row>
        {t.headline ? (
          <T variant="muted" style={{ textAlign: 'center' }}>
            {t.headline}
          </T>
        ) : null}
        <Row gap={14} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {t.city || t.country ? (
            <Row gap={4}>
              <MapPin color={colors.textFaint} size={14} />
              <T variant="small">{[t.city, t.country].filter(Boolean).join(', ')}</T>
            </Row>
          ) : null}
          {t.wins ? (
            <Row gap={4}>
              <Trophy color={colors.amber} size={14} />
              <T variant="small" style={{ color: colors.amber }}>
                {t.wins} competition win{t.wins > 1 ? 's' : ''}
              </T>
            </Row>
          ) : null}
          {t.experienceYears ? <T variant="small">{t.experienceYears} yrs experience</T> : null}
          <T variant="small" style={{ color: t.isAvailable ? colors.success : colors.textFaint }}>
            {t.isAvailable ? '● Available' : '○ Unavailable'}
          </T>
        </Row>
        <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {t.genres.map((g) => (
            <Tag key={g.id} label={g.name} color={colors.purple} />
          ))}
          {t.skills.map((s) => (
            <Tag key={s} label={s} />
          ))}
        </Row>
      </View>

      {!isSelf ? (
        <View style={{ gap: space.sm }}>
          <Row>
            <GradientButton title="Invite" style={{ flex: 1 }} onPress={() => contact('invite')} />
            <GradientButton title="Book" variant="outline" style={{ flex: 1 }} onPress={() => contact('book')} />
          </Row>
          {isSeekerUser ? (
            <GradientButton
              variant="ghost"
              title={t.shortlisted ? 'Shortlisted' : 'Add to shortlist'}
              icon={t.shortlisted ? <BookmarkCheck color={colors.amber} size={18} /> : <Bookmark color={colors.text} size={18} />}
              loading={toggleShortlist.isPending}
              onPress={() => toggleShortlist.mutate(t)}
            />
          ) : null}
        </View>
      ) : (
        <GradientButton title="Edit my profile" variant="outline" onPress={() => router.push('/profile-edit')} />
      )}

      {t.bio ? (
        <Card>
          <T variant="h3" style={{ marginBottom: 6 }}>
            About
          </T>
          <T variant="muted">{t.bio}</T>
        </Card>
      ) : null}

      <Card style={{ gap: 6 }}>
        <T variant="h3">Contact</T>
        {t.contact ? (
          <>
            {t.contact.email ? <T onPress={() => Linking.openURL(`mailto:${t.contact!.email}`)} style={{ color: colors.blue }}>{t.contact.email}</T> : null}
            {t.contact.phone ? <T onPress={() => Linking.openURL(`tel:${t.contact!.phone}`)} style={{ color: colors.blue }}>{t.contact.phone}</T> : null}
          </>
        ) : (
          <Row gap={8}>
            <Lock color={colors.textFaint} size={16} />
            <T variant="muted" style={{ flex: 1 }}>
              Contact details are available to subscribed talent seekers.
            </T>
          </Row>
        )}
        {social.length ? (
          <Row style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {social.map(([k, v]) => (
              <Tag key={k} label={k} onPress={() => Linking.openURL(v.startsWith('http') ? v : `https://${v}`)} />
            ))}
          </Row>
        ) : null}
      </Card>

      <SectionHeader title="Portfolio" />
      {t.portfolio.length ? (
        <Row style={{ flexWrap: 'wrap' }} gap={space.sm}>
          {t.portfolio.map((p) => (
            <View key={p.id} style={{ width: '48%' }}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <MediaThumb media={p.media} height={120} />
                {p.caption ? (
                  <T variant="small" style={{ padding: 8 }} numberOfLines={2}>
                    {p.caption}
                  </T>
                ) : null}
              </Card>
            </View>
          ))}
        </Row>
      ) : (
        <EmptyState title="No portfolio items yet" />
      )}

      <SectionHeader title="Competition entries" />
      {t.entries.length ? t.entries.map((e) => <EntryCard key={e.id} entry={e} />) : <EmptyState title="No entries yet" />}

      {!isSelf ? (
        <Pressable
          style={{ alignSelf: 'center', marginTop: space.lg }}
          onPress={() => requireAuth(() => router.push({ pathname: '/report', params: { targetType: 'ACCOUNT', targetId: t.id } }), { requireActive: false })}
        >
          <Row gap={6}>
            <Flag color={colors.textFaint} size={14} />
            <T variant="small">Report or block this account</T>
          </Row>
        </Pressable>
      ) : null}
    </Screen>
  );
}
