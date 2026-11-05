import React from 'react';
import { Linking, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { FileText, KeyRound, Mail, Shield, User } from 'lucide-react-native';
import { api } from '@/api/client';
import { GradientButton, MenuItem, Screen, T } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { isSeeker, useAuth } from '@/store/auth';
import { signOut } from '@/lib/session';
import { confirm, showError } from '@/lib/notify';
import Constants from 'expo-constants';

export default function Settings() {
  const user = useAuth((s) => s.user);
  if (!user) return <SignInPrompt />;

  const deleteAccount = () =>
    confirm(
      'Delete your account?',
      'Your profile, entries and messages will be removed. Wallet balances must be withdrawn first. This cannot be undone.',
      async () => {
        try {
          await api.del('/me');
          await signOut();
          router.replace('/welcome');
        } catch (e) {
          showError(e, 'Could not delete account');
        }
      },
      'Delete',
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Settings' }} />
      <T variant="muted">Signed in as {user.email}</T>
      <View>
        <MenuItem icon={User} title="Edit profile" onPress={() => router.push(isSeeker(user) ? '/org-edit' : '/profile-edit')} />
        <MenuItem icon={KeyRound} title="Change password" subtitle="We'll email you a reset code" onPress={() => router.push('/forgot-password')} />
        <MenuItem icon={Mail} title="Contact support" onPress={() => Linking.openURL('mailto:support@tazonix.com')} />
        <MenuItem icon={Shield} title="Privacy policy" onPress={() => Linking.openURL('https://tazonix.com/privacy')} />
        <MenuItem icon={FileText} title="Terms of service" onPress={() => Linking.openURL('https://tazonix.com/terms')} />
      </View>
      <GradientButton title="Delete account" variant="danger" onPress={deleteAccount} />
      <T variant="small" style={{ textAlign: 'center' }}>
        Tazonix v{Constants.expoConfig?.version ?? '1.0.0'} · © Nextopicon Media Inc.
      </T>
    </Screen>
  );
}
