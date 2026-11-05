import React, { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api } from '@/api/client';
import type { ReportTarget } from '@/api/types';
import { GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { notify, showError } from '@/lib/notify';

const reasons = ['Spam', 'Harassment', 'Inappropriate content', 'Impersonation', 'Vote manipulation', 'Copyright', 'Other'];

export default function Report() {
  const { targetType, targetId } = useLocalSearchParams<{ targetType: ReportTarget; targetId: string }>();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, details: details.trim() || undefined });
      notify('Report sent', 'Thanks. Our moderators will review it.');
      router.back();
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const block = async () => {
    try {
      await api.post('/blocks', { accountId: targetId });
      notify('Account blocked', "You won't see content or messages from this account.");
      router.back();
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Report', presentation: 'modal' }} />
      <T variant="h2">What's wrong?</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {reasons.map((r) => (
          <Tag key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </Row>
      <Input label="Details (optional)" value={details} onChangeText={setDetails} multiline maxLength={1000} />
      <GradientButton title="Submit report" loading={loading} disabled={!reason} onPress={submit} />
      {targetType === 'ACCOUNT' ? <GradientButton title="Block this account" variant="danger" onPress={block} /> : null}
    </Screen>
  );
}
