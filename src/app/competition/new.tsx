import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, absoluteUrl, api } from '@/api/client';
import type { Competition, Media, MediaKind, Visibility } from '@/api/types';
import { useGenres } from '@/api/hooks';
import { GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { pickMedia, uploadMedia } from '@/lib/upload';
import { toMinor } from '@/lib/format';
import { notify, showError } from '@/lib/notify';
import { radius } from '@/theme';

const kinds: MediaKind[] = ['VIDEO', 'AUDIO', 'IMAGE'];
const visibilities: { value: Visibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'SEMI_PRIVATE', label: 'Semi-private' },
  { value: 'PRIVATE', label: 'Private' },
];

const isoFrom = (s: string) => (Number.isNaN(Date.parse(s)) ? null : new Date(s).toISOString());

export default function NewCompetition() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const genres = useGenres();
  const [f, setF] = useState({
    title: '',
    description: '',
    rules: '',
    startsAt: '',
    submissionEndsAt: '',
    votingEndsAt: '',
    reward: '',
    prizeDescription: '',
    website: '',
    pin: '',
    maxMinutes: '3',
  });
  const [genreId, setGenreId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [accepted, setAccepted] = useState<MediaKind[]>(['VIDEO']);
  const [currency, setCurrency] = useState('CAD');
  const [sponsor, setSponsor] = useState<Media | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  if (!user) return <SignInPrompt />;
  if (!user.entitlements.createCompetitions) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Create competition' }} />
        <T variant="h2">Organizer access required</T>
        <T variant="muted">Creating competitions is available to approved organizers on the Agency or Brand plan.</T>
        <GradientButton title="See plans" onPress={() => router.replace('/plans')} />
      </Screen>
    );
  }

  const pickSponsor = async () => {
    const picked = await pickMedia(['IMAGE']);
    if (!picked) return;
    try {
      setSponsor(await uploadMedia(picked, { waitUntilReady: true }));
    } catch (e) {
      showError(e, 'Upload failed');
    }
  };

  const submit = async () => {
    const startsAt = isoFrom(f.startsAt);
    const submissionEndsAt = isoFrom(f.submissionEndsAt);
    const votingEndsAt = isoFrom(f.votingEndsAt);
    if (!startsAt || !submissionEndsAt || !votingEndsAt) return notify('Check the dates', 'Use the format YYYY-MM-DD HH:mm.');
    if (!(startsAt < submissionEndsAt && submissionEndsAt <= votingEndsAt))
      return notify('Invalid timeline', 'Start must be before the submission deadline, which must be on or before voting end.');
    if (visibility !== 'PUBLIC' && !f.pin.trim()) return notify('PIN required', 'Private and semi-private competitions need a PIN.');
    if (!genreId) return notify('Pick a genre');
    setLoading(true);
    try {
      const c = await api.post<Competition>('/competitions', {
        title: f.title.trim(),
        description: f.description.trim() || null,
        rules: f.rules.trim() || null,
        genreId,
        visibility,
        pin: visibility !== 'PUBLIC' ? f.pin.trim() : undefined,
        startsAt,
        submissionEndsAt,
        votingEndsAt,
        acceptedMedia: accepted,
        maxDurationSec: f.maxMinutes ? Math.round(Number(f.maxMinutes) * 60) : null,
        rewardAmountMinor: toMinor(f.reward),
        rewardCurrency: currency,
        prizeDescription: f.prizeDescription.trim() || null,
        website: f.website.trim() || null,
        sponsorMediaId: sponsor?.id,
      });
      qc.invalidateQueries({ queryKey: ['my-competitions'] });
      notify('Submitted for review', 'The Tazonix team will review your competition before it goes live.');
      router.replace(`/competition/${c.slug}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') router.replace('/plans');
      else showError(e, 'Could not create competition');
    } finally {
      setLoading(false);
    }
  };

  const sponsorUrl = absoluteUrl(sponsor?.url);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Create competition' }} />
      <Input label="Title" value={f.title} onChangeText={set('title')} placeholder="Summer Voice 2027" />
      <T variant="label">Genre</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          {(genres.data ?? []).map((g) => (
            <Tag key={g.id} label={g.name} selected={genreId === g.id} onPress={() => setGenreId(g.id)} />
          ))}
        </Row>
      </ScrollView>
      <Input label="Description" value={f.description} onChangeText={set('description')} multiline />
      <Input label="Rules" value={f.rules} onChangeText={set('rules')} multiline />
      <Input label="Opens (YYYY-MM-DD HH:mm)" value={f.startsAt} onChangeText={set('startsAt')} placeholder="2027-01-10 09:00" />
      <Input label="Submissions close" value={f.submissionEndsAt} onChangeText={set('submissionEndsAt')} placeholder="2027-01-31 23:59" />
      <Input label="Voting ends" value={f.votingEndsAt} onChangeText={set('votingEndsAt')} placeholder="2027-02-14 23:59" />
      <T variant="label">Accepted media</T>
      <Row>
        {kinds.map((k) => (
          <Tag
            key={k}
            label={k.toLowerCase()}
            selected={accepted.includes(k)}
            onPress={() => setAccepted(accepted.includes(k) ? (accepted.length > 1 ? accepted.filter((x) => x !== k) : accepted) : [...accepted, k])}
          />
        ))}
      </Row>
      <Input label="Max duration (minutes)" value={f.maxMinutes} onChangeText={set('maxMinutes')} keyboardType="number-pad" />
      <T variant="label">Access</T>
      <Row>
        {visibilities.map((v) => (
          <Tag key={v.value} label={v.label} selected={visibility === v.value} onPress={() => setVisibility(v.value)} />
        ))}
      </Row>
      {visibility !== 'PUBLIC' ? <Input label="PIN" value={f.pin} onChangeText={set('pin')} autoCapitalize="characters" /> : null}
      <Input label="Cash reward (optional)" value={f.reward} onChangeText={set('reward')} keyboardType="decimal-pad" placeholder="1000.00" />
      <Row>
        {['CAD', 'USD', 'NGN'].map((c) => (
          <Tag key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
        ))}
      </Row>
      <Input label="Prize description" value={f.prizeDescription} onChangeText={set('prizeDescription')} placeholder="Studio session + mentorship" />
      <Input label="Website" value={f.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" />
      {sponsorUrl ? <Image source={{ uri: sponsorUrl }} style={{ height: 140, borderRadius: radius.lg }} contentFit="cover" /> : null}
      <GradientButton title={sponsor ? 'Change sponsor image' : 'Add sponsor image'} variant="ghost" onPress={pickSponsor} />
      <GradientButton title="Submit for review" loading={loading} disabled={!f.title.trim()} onPress={submit} />
    </Screen>
  );
}
