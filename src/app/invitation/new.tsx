import React, { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/api/client';
import type { InviteType } from '@/api/types';
import { GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { notify, showError } from '@/lib/notify';

const types: InviteType[] = ['AUDITION', 'BOOKING', 'COLLAB', 'GENERAL'];

export default function NewInvitation() {
  const { talentId, name } = useLocalSearchParams<{ talentId: string; name?: string }>();
  const qc = useQueryClient();
  const [type, setType] = useState<InviteType>('AUDITION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      await api.post('/invitations', { talentId, type, subject: subject.trim(), message: message.trim() });
      qc.invalidateQueries({ queryKey: ['invitations'] });
      notify('Invitation sent', `${name ?? 'The talent'} will be notified.`);
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') router.replace({ pathname: '/plans', params: { reason: 'contact' } });
      else showError(e, 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'New invitation' }} />
      <T variant="h2">Invite {name ?? 'talent'}</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {types.map((t) => (
          <Tag key={t} label={titleCase(t)} selected={type === t} onPress={() => setType(t)} />
        ))}
      </Row>
      <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Audition for Summer Voice showcase" maxLength={140} />
      <Input label="Message" value={message} onChangeText={setMessage} multiline placeholder="Share details: dates, location, what you need…" maxLength={2000} />
      <GradientButton title="Send invitation" loading={loading} disabled={!subject.trim() || !message.trim()} onPress={send} />
    </Screen>
  );
}
