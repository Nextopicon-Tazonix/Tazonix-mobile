import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { ApiError, api } from '@/api/client';
import type { AiMatchResult } from '@/api/types';
import { useGenres } from '@/api/hooks';
import { Card, EmptyState, GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { TalentCard } from '@/components/cards';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { refreshMe } from '@/lib/session';
import { showError } from '@/lib/notify';
import { colors } from '@/theme';

const examples = [
  'Female afrobeats vocalist in Toronto for a June wedding reception',
  'Energetic hip-hop dancers in Lagos for a brand music video',
  'Jazz saxophonist available for corporate events in Accra',
];

export default function AiMatch() {
  const user = useAuth((s) => s.user);
  const genres = useGenres();
  const [brief, setBrief] = useState('');
  const [country, setCountry] = useState('');
  const [genreId, setGenreId] = useState<string | null>(null);

  const match = useMutation({
    mutationFn: () =>
      api.post<AiMatchResult>('/ai/match', { brief: brief.trim(), genreId: genreId ?? undefined, country: country.trim().toUpperCase() || undefined }),
    onSuccess: () => refreshMe(),
    onError: (e) => {
      if (e instanceof ApiError && (e.code === 'SUBSCRIPTION_REQUIRED' || e.code === 'RATE_LIMITED')) router.push('/plans');
      else showError(e, 'AI match failed');
    },
  });

  if (!user) return <SignInPrompt title="AI Match" message="Sign in to describe your brief and get AI-ranked talent." />;
  const ent = user.entitlements;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'AI Match' }} />
      <Row gap={8}>
        <Sparkles color={colors.magenta} size={22} />
        <T variant="h2">Who are you looking for?</T>
      </Row>
      <T variant="small">
        {ent.aiMatchesUsed}/{ent.aiMatchesPerMonth} matches used this month
      </T>
      <Input value={brief} onChangeText={setBrief} multiline placeholder="Describe the role, style, location, dates and budget…" maxLength={1000} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          {examples.map((ex) => (
            <Tag key={ex} label={ex.length > 38 ? `${ex.slice(0, 38)}…` : ex} onPress={() => setBrief(ex)} />
          ))}
        </Row>
      </ScrollView>
      <Input placeholder="Country code (optional)" value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          {(genres.data ?? []).map((g) => (
            <Tag key={g.id} label={g.name} selected={genreId === g.id} onPress={() => setGenreId(genreId === g.id ? null : g.id)} />
          ))}
        </Row>
      </ScrollView>
      <GradientButton
        title="Find matches"
        icon={<Sparkles color="#fff" size={18} />}
        loading={match.isPending}
        disabled={brief.trim().length < 10}
        onPress={() => match.mutate()}
      />

      {match.data ? (
        <View style={{ gap: 12 }}>
          <T variant="small">{match.data.usedAi ? 'Ranked and explained by Tazonix AI' : 'Ranked by keyword relevance (AI unavailable)'}</T>
          {match.data.results.length ? (
            match.data.results.map((r) => (
              <View key={r.talent.id} style={{ gap: 6 }}>
                <TalentCard talent={r.talent} right={<Tag label={`${Math.round(r.score * 100)}%`} color={colors.amber} />} />
                <Card style={{ paddingVertical: 10, borderColor: colors.purple }}>
                  <T variant="muted">✨ {r.reason}</T>
                </Card>
              </View>
            ))
          ) : (
            <EmptyState title="No matches" message="Try a broader brief or remove filters." />
          )}
        </View>
      ) : null}
    </Screen>
  );
}
