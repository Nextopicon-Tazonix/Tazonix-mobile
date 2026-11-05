import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/api/client';
import type { AuthResponse } from '@/api/types';
import { GradientButton, Input, Screen, Segmented, T } from '@/components/ui';
import { startSession } from '@/lib/session';

type SignupRole = 'TALENT' | 'SEEKER';

export default function SignUp() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<SignupRole>(params.role === 'SEEKER' ? 'SEEKER' : 'TALENT');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/signup', { email: email.trim(), password, displayName: displayName.trim(), role });
      await startSession(res);
      router.replace({ pathname: '/verify-email', params: res.devEmailToken ? { devToken: res.devEmailToken } : {} });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="h1">Create your account</T>
      <Segmented<SignupRole>
        value={role}
        onChange={setRole}
        options={[
          { value: 'TALENT', label: 'Join as Talent' },
          { value: 'SEEKER', label: 'Post Opportunities' },
        ]}
      />
      <Input
        label={role === 'TALENT' ? 'Stage / display name' : 'Your name or organization'}
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
      />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={error}
      />
      <GradientButton title="Create account" onPress={submit} loading={loading} disabled={!email || !password || !displayName} />
      <T variant="small" style={{ textAlign: 'center' }}>
        By continuing you agree to the Tazonix Terms and Privacy Policy.
      </T>
    </Screen>
  );
}
