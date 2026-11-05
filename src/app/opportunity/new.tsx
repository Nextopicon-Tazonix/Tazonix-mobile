import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/api/client';
import type { Opportunity, OpportunityType } from '@/api/types';
import { GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useGenres } from '@/api/hooks';
import { useAuth } from '@/store/auth';
import { titleCase } from '@/lib/format';
import { notify, showError } from '@/lib/notify';

const types: OpportunityType[] = ['AUDITION', 'GIG', 'CASTING', 'JOB', 'COLLAB'];

export default function NewOpportunity() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const genres = useGenres();
  const [form, setForm] = useState({ title: '', description: '', country: '', city: '', compensation: '', deadline: '' });
  const [type, setType] = useState<OpportunityType>('AUDITION');
  const [genreId, setGenreId] = useState<string | null>(null);
  const [remote, setRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return <SignInPrompt />;
  if (!user.entitlements.postOpportunities) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Post opportunity' }} />
        <T variant="h2">Upgrade to post opportunities</T>
        <T variant="muted">Posting auditions, gigs and casting calls is included in the Agency and Brand plans.</T>
        <GradientButton title="See plans" onPress={() => router.replace('/plans')} />
      </Screen>
    );
  }

  const submit = async () => {
    if (form.deadline && Number.isNaN(Date.parse(form.deadline))) return notify('Invalid deadline', 'Use the format YYYY-MM-DD.');
    setLoading(true);
    try {
      const o = await api.post<Opportunity>('/opportunities', {
        type,
        title: form.title.trim(),
        description: form.description.trim(),
        genreId,
        country: form.country.trim().toUpperCase() || null,
        city: form.city.trim() || null,
        remote,
        compensation: form.compensation.trim() || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      qc.invalidateQueries({ queryKey: ['my-opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      router.replace(`/opportunity/${o.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') router.replace('/plans');
      else showError(e, 'Could not post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Post opportunity' }} />
      <T variant="label">Type</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {types.map((t) => (
          <Tag key={t} label={titleCase(t)} selected={type === t} onPress={() => setType(t)} />
        ))}
      </Row>
      <Input label="Title" value={form.title} onChangeText={set('title')} placeholder="Female afrobeats vocalist for June wedding" />
      <Input label="Description" value={form.description} onChangeText={set('description')} multiline placeholder="Requirements, dates, what to submit…" />
      <T variant="label">Genre</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          {(genres.data ?? []).map((g) => (
            <Tag key={g.id} label={g.name} selected={genreId === g.id} onPress={() => setGenreId(genreId === g.id ? null : g.id)} />
          ))}
        </Row>
      </ScrollView>
      <Row>
        <Tag label="Remote" selected={remote} onPress={() => setRemote(!remote)} />
      </Row>
      {!remote ? (
        <>
          <Input label="Country code" value={form.country} onChangeText={set('country')} autoCapitalize="characters" maxLength={2} placeholder="CA" />
          <Input label="City" value={form.city} onChangeText={set('city')} placeholder="Toronto" />
        </>
      ) : null}
      <Input label="Compensation" value={form.compensation} onChangeText={set('compensation')} placeholder="CAD 800 / day" />
      <Input label="Application deadline (YYYY-MM-DD)" value={form.deadline} onChangeText={set('deadline')} placeholder="2026-12-15" />
      <GradientButton title="Publish" loading={loading} disabled={!form.title.trim() || !form.description.trim()} onPress={submit} />
    </Screen>
  );
}
