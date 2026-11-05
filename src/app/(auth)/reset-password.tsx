import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/api/client';
import { GradientButton, Input, Screen, T } from '@/components/ui';
import { notify, showError } from '@/lib/notify';

export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 8) return notify('Password too short', 'Use at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/auth/password/reset', { token: token.trim(), newPassword: password });
      notify('Password updated', 'Sign in with your new password.');
      router.replace('/sign-in');
    } catch (e) {
      showError(e, 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="h1">Choose a new password</T>
      <Input label="Reset code" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <GradientButton title="Update password" onPress={submit} loading={loading} disabled={!token || !password} />
    </Screen>
  );
}
