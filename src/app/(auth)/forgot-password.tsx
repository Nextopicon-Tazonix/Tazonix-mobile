import React, { useState } from 'react';
import { router } from 'expo-router';
import { api } from '@/api/client';
import { GradientButton, Input, Screen, T } from '@/components/ui';
import { notify, showError } from '@/lib/notify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ ok: true; devResetToken?: string }>('/auth/password/forgot', { email: email.trim() });
      notify('Check your email', 'If an account exists for that address, we sent a reset code.');
      router.push({ pathname: '/reset-password', params: res.devResetToken ? { token: res.devResetToken } : {} });
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="h1">Reset your password</T>
      <T variant="muted">Enter your account email and we'll send you a reset code.</T>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <GradientButton title="Send reset code" onPress={submit} loading={loading} disabled={!email} />
      <GradientButton title="I already have a code" variant="ghost" onPress={() => router.push('/reset-password')} />
    </Screen>
  );
}
