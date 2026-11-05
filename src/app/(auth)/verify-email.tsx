import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Me } from '@/api/types';
import { Card, GradientButton, Input, Screen, T } from '@/components/ui';
import { homeFor, signOut } from '@/lib/session';
import { notify, showError } from '@/lib/notify';
import { useAuth } from '@/store/auth';
import { colors } from '@/theme';

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ devToken?: string; token?: string }>();
  const user = useAuth((s) => s.user);
  const [token, setToken] = useState(params.token ?? params.devToken ?? '');
  const [devToken, setDevToken] = useState(params.devToken);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ user: Me }>('/auth/email/verify', { token: token.trim() });
      useAuth.getState().setUser(res.user);
      router.replace(homeFor(res.user));
    } catch (e) {
      showError(e, 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await api.post<{ ok: true; devEmailToken?: string }>('/auth/email/resend');
      if (res.devEmailToken) {
        setDevToken(res.devEmailToken);
        setToken(res.devEmailToken);
      }
      notify('Email sent', 'Check your inbox for a new verification link.');
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Screen>
      <MailCheck color={colors.amber} size={48} />
      <T variant="h1">Check your inbox</T>
      <T variant="muted">
        We sent a verification code to {user?.email ?? 'your email'}. Paste it below to confirm your account.
      </T>
      {devToken ? (
        <Card style={{ borderColor: colors.amber }}>
          <T variant="small" style={{ color: colors.amber }}>
            Development mode: the API returned your verification token and it has been filled in for you.
          </T>
        </Card>
      ) : null}
      <Input label="Verification code" value={token} onChangeText={setToken} autoCapitalize="none" />
      <GradientButton title="Verify email" onPress={verify} loading={loading} disabled={!token} />
      {user ? <GradientButton title="Resend email" variant="ghost" onPress={resend} /> : null}
      <GradientButton
        title="Sign out"
        variant="ghost"
        onPress={async () => {
          await signOut();
          router.replace('/welcome');
        }}
      />
    </Screen>
  );
}
