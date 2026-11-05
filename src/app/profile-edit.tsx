import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Me, TalentPublic } from '@/api/types';
import { useGenres } from '@/api/hooks';
import { Avatar, Card, GradientButton, Input, Row, Screen, SectionHeader, T, Tag } from '@/components/ui';
import { MediaThumb } from '@/components/MediaView';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { refreshMe } from '@/lib/session';
import { pickMedia, uploadMedia } from '@/lib/upload';
import { notify, showError } from '@/lib/notify';
import { colors, space } from '@/theme';

export default function ProfileEdit() {
  const user = useAuth((s) => s.user);
  if (!user) return <SignInPrompt />;
  return <Editor user={user} />;
}

function Editor({ user }: { user: Me }) {
  const qc = useQueryClient();
  const genres = useGenres();
  const tp = user.talentProfile;
  const [basics, setBasics] = useState({
    displayName: user.displayName,
    handle: user.handle,
    phone: user.phone ?? '',
    country: user.country ?? '',
    region: user.region ?? '',
    city: user.city ?? '',
  });
  const [profile, setProfile] = useState({
    headline: tp?.headline ?? '',
    bio: tp?.bio ?? '',
    experienceYears: tp?.experienceYears != null ? String(tp.experienceYears) : '',
    instagram: tp?.instagram ?? '',
    tiktok: tp?.tiktok ?? '',
    youtube: tp?.youtube ?? '',
    website: tp?.website ?? '',
  });
  const [skills, setSkills] = useState<string[]>(tp?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [genreIds, setGenreIds] = useState<string[]>(tp?.genreIds ?? []);
  const [isAvailable, setAvailable] = useState(tp?.isAvailable ?? true);
  const [isDiscoverable, setDiscoverable] = useState(tp?.isDiscoverable ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'portfolio' | null>(null);

  // Portfolio is read from the public profile, which includes media items.
  const pub = useQuery({ queryKey: ['talent', user.handle], queryFn: () => api.get<TalentPublic>(`/talent/${user.handle}`) });

  const assist = useMutation({
    mutationFn: () => api.post<{ headline: string; bio: string; skills: string[] }>('/ai/profile-assist', { headline: profile.headline, bio: profile.bio, skills }),
    onSuccess: (r) => {
      setProfile((p) => ({ ...p, headline: r.headline || p.headline, bio: r.bio || p.bio }));
      if (r.skills?.length) setSkills((s) => Array.from(new Set([...s, ...r.skills])).slice(0, 15));
      notify('Suggestions applied ✨', 'Review the AI suggestions and save when you are happy.');
    },
    onError: (e) => showError(e, 'AI assist failed'),
  });

  const setB = (k: keyof typeof basics) => (v: string) => setBasics((b) => ({ ...b, [k]: v }));
  const setP = (k: keyof typeof profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const changeAvatar = async () => {
    const picked = await pickMedia(['IMAGE']);
    if (!picked) return;
    setUploading('avatar');
    try {
      const media = await uploadMedia(picked, { waitUntilReady: true });
      await api.patch('/me', { avatarMediaId: media.id });
      await refreshMe();
    } catch (e) {
      showError(e, 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const addPortfolio = async () => {
    const picked = await pickMedia(['IMAGE', 'VIDEO']);
    if (!picked) return;
    setUploading('portfolio');
    try {
      const media = await uploadMedia(picked);
      await api.post('/me/portfolio', { mediaId: media.id });
      qc.invalidateQueries({ queryKey: ['talent', user.handle] });
      if (media.status !== 'READY') notify('Uploaded', 'We are processing your file. It appears on your public profile once it is ready.');
    } catch (e) {
      showError(e, 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removePortfolio = async (id: string) => {
    try {
      await api.del(`/me/portfolio/${id}`);
      qc.invalidateQueries({ queryKey: ['talent', user.handle] });
    } catch (e) {
      showError(e);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/me', {
        displayName: basics.displayName.trim(),
        handle: basics.handle.trim().toLowerCase(),
        phone: basics.phone.trim() || null,
        country: basics.country.trim().toUpperCase() || null,
        region: basics.region.trim() || null,
        city: basics.city.trim() || null,
      });
      await api.put('/me/talent-profile', {
        headline: profile.headline.trim() || null,
        bio: profile.bio.trim() || null,
        experienceYears: profile.experienceYears ? Number(profile.experienceYears) : null,
        instagram: profile.instagram.trim() || null,
        tiktok: profile.tiktok.trim() || null,
        youtube: profile.youtube.trim() || null,
        website: profile.website.trim() || null,
        skills,
        genreIds,
        isAvailable,
        isDiscoverable,
      });
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['talent'] });
      notify('Profile saved');
      router.back();
    } catch (e) {
      showError(e, 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const s = skillDraft.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillDraft('');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Edit profile' }} />
      <Pressable onPress={changeAvatar} style={{ alignSelf: 'center', alignItems: 'center', gap: 6 }} accessibilityLabel="Change photo">
        <Avatar uri={user.avatarUrl} name={user.displayName} size={96} />
        <Row gap={6}>
          <Camera color={colors.blue} size={16} />
          <T style={{ color: colors.blue }}>{uploading === 'avatar' ? 'Uploading…' : 'Change photo'}</T>
        </Row>
      </Pressable>

      <Input label="Display name" value={basics.displayName} onChangeText={setB('displayName')} />
      <Input label="Handle" value={basics.handle} onChangeText={setB('handle')} autoCapitalize="none" />
      <Input label="Headline" value={profile.headline} onChangeText={setP('headline')} maxLength={140} placeholder="Afro-soul vocalist & songwriter" />
      <Input label="Bio" value={profile.bio} onChangeText={setP('bio')} multiline maxLength={2000} />
      <GradientButton
        title="Improve with AI"
        variant="outline"
        icon={<Sparkles color={colors.magenta} size={18} />}
        loading={assist.isPending}
        onPress={() => assist.mutate()}
      />

      <T variant="label">Genres</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {(genres.data ?? []).map((g) => (
          <Tag
            key={g.id}
            label={g.name}
            selected={genreIds.includes(g.id)}
            onPress={() => setGenreIds(genreIds.includes(g.id) ? genreIds.filter((x) => x !== g.id) : [...genreIds, g.id])}
          />
        ))}
      </Row>

      <T variant="label">Skills</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {skills.map((s) => (
          <Tag key={s} label={`${s} ✕`} onPress={() => setSkills(skills.filter((x) => x !== s))} />
        ))}
      </Row>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input value={skillDraft} onChangeText={setSkillDraft} placeholder="Add a skill" onSubmitEditing={addSkill} returnKeyType="done" />
        </View>
        <GradientButton small title="Add" variant="ghost" onPress={addSkill} />
      </Row>

      <Input label="Years of experience" value={profile.experienceYears} onChangeText={setP('experienceYears')} keyboardType="number-pad" />
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input label="Country" value={basics.country} onChangeText={setB('country')} autoCapitalize="characters" maxLength={2} placeholder="CA" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Province/State" value={basics.region} onChangeText={setB('region')} />
        </View>
      </Row>
      <Input label="City" value={basics.city} onChangeText={setB('city')} />
      <Input label="Phone (only visible to subscribed seekers)" value={basics.phone} onChangeText={setB('phone')} keyboardType="phone-pad" />

      <T variant="label">Visibility</T>
      <Row>
        <Tag label="Available for work" selected={isAvailable} onPress={() => setAvailable(!isAvailable)} />
        <Tag label="Discoverable in search" selected={isDiscoverable} onPress={() => setDiscoverable(!isDiscoverable)} />
      </Row>

      <SectionHeader title="Social links" />
      <Input label="Instagram" value={profile.instagram} onChangeText={setP('instagram')} autoCapitalize="none" />
      <Input label="TikTok" value={profile.tiktok} onChangeText={setP('tiktok')} autoCapitalize="none" />
      <Input label="YouTube" value={profile.youtube} onChangeText={setP('youtube')} autoCapitalize="none" />
      <Input label="Website" value={profile.website} onChangeText={setP('website')} autoCapitalize="none" keyboardType="url" />

      <SectionHeader title="Portfolio" />
      <Row style={{ flexWrap: 'wrap' }} gap={space.sm}>
        {(pub.data?.portfolio ?? []).map((p) => (
          <View key={p.id} style={{ width: '48%' }}>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <MediaThumb media={p.media} height={110} />
              <Pressable onPress={() => removePortfolio(p.id)} style={{ padding: 8, alignSelf: 'flex-end' }} accessibilityLabel="Remove item">
                <Trash2 color={colors.danger} size={16} />
              </Pressable>
            </Card>
          </View>
        ))}
      </Row>
      <GradientButton
        title="Add photo or video"
        variant="ghost"
        icon={<Plus color={colors.text} size={18} />}
        loading={uploading === 'portfolio'}
        onPress={addPortfolio}
      />

      <GradientButton title="Save profile" loading={saving} onPress={save} />
    </Screen>
  );
}
