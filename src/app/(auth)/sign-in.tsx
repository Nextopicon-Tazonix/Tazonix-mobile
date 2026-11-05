import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { api } from '@/api/client';
import type { AuthResponse } from '@/api/types';
import { GradientButton, Input, Row, Screen, T } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { homeFor, startSession } from '@/lib/session';
import { colors } from '@/theme';

export default function SignIn() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email: email.trim(), password });
      await startSession(res);
      const home = homeFor(res.user);
      router.replace(returnTo && res.user.status !== 'PENDING_EMAIL' ? (returnTo as Href) : home);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Logo size={36} />
      <T variant="h1" style={{ marginTop: 16 }}>
        Welcome back
      </T>
      <T variant="muted">Sign in to vote, enter competitions and connect.</T>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" error={error} />
      <GradientButton title="Sign in" onPress={submit} loading={loading} disabled={!email || !password} />
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <Pressable onPress={() => router.push('/forgot-password')}>
          <T style={{ color: colors.blue }}>Forgot password?</T>
        </Pressable>
        <Pressable onPress={() => router.push('/choose-role')}>
          <T style={{ color: colors.blue }}>Create account</T>
        </Pressable>
      </Row>
    </Screen>
  );
}
