import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Me } from '@/api/types';
import { Avatar, GradientButton, Input, Row, Screen, T } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { refreshMe } from '@/lib/session';
import { pickMedia, uploadMedia } from '@/lib/upload';
import { notify, showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function OrgEdit() {
  const user = useAuth((s) => s.user);
  if (!user) return <SignInPrompt />;
  return <Editor user={user} />;
}

function Editor({ user }: { user: Me }) {
  const org = user.orgProfile;
  const [form, setForm] = useState({
    displayName: user.displayName,
    orgName: org?.orgName ?? '',
    orgType: org?.orgType ?? '',
    website: org?.website ?? '',
    about: org?.about ?? '',
    phone: user.phone ?? '',
    country: user.country ?? '',
    city: user.city ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const changeLogo = async () => {
    const picked = await pickMedia(['IMAGE']);
    if (!picked) return;
    setUploading(true);
    try {
      const media = await uploadMedia(picked, { waitUntilReady: true });
      await api.patch('/me', { avatarMediaId: media.id });
      await refreshMe();
    } catch (e) {
      showError(e, 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/me', {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        country: form.country.trim().toUpperCase() || null,
        city: form.city.trim() || null,
      });
      await api.put('/me/org-profile', {
        orgName: form.orgName.trim() || null,
        orgType: form.orgType.trim() || null,
        website: form.website.trim() || null,
        about: form.about.trim() || null,
      });
      await refreshMe();
      notify('Organization saved');
      router.back();
    } catch (e) {
      showError(e, 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Organization profile' }} />
      <Pressable onPress={changeLogo} style={{ alignSelf: 'center', alignItems: 'center', gap: 6 }} accessibilityLabel="Change logo">
        <Avatar uri={user.avatarUrl} name={form.orgName || user.displayName} size={88} />
        <Row gap={6}>
          <Camera color={colors.blue} size={16} />
          <T style={{ color: colors.blue }}>{uploading ? 'Uploading…' : 'Change logo'}</T>
        </Row>
      </Pressable>
      <Input label="Contact name" value={form.displayName} onChangeText={set('displayName')} />
      <Input label="Organization name" value={form.orgName} onChangeText={set('orgName')} />
      <Input label="Type" value={form.orgType} onChangeText={set('orgType')} placeholder="Talent agency, label, event organizer, brand…" />
      <Input label="Website" value={form.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" />
      <Input label="About" value={form.about} onChangeText={set('about')} multiline />
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input label="Country" value={form.country} onChangeText={set('country')} autoCapitalize="characters" maxLength={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="City" value={form.city} onChangeText={set('city')} />
        </View>
      </Row>
      <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <GradientButton title="Save" loading={saving} onPress={save} />
    </Screen>
  );
}
