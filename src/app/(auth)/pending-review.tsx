import React, { useState } from 'react';
import { router } from 'expo-router';
import { Hourglass, ShieldAlert } from 'lucide-react-native';
import { GradientButton, Screen, T } from '@/components/ui';
import { homeFor, refreshMe, signOut } from '@/lib/session';
import { isSeeker, useAuth } from '@/store/auth';
import { notify } from '@/lib/notify';
import { colors } from '@/theme';

export default function PendingReview() {
  const user = useAuth((s) => s.user);
  const [loading, setLoading] = useState(false);
  const suspended = user?.status === 'SUSPENDED';

  const check = async () => {
    setLoading(true);
    const me = await refreshMe();
    setLoading(false);
    if (me?.status === 'ACTIVE') router.replace(homeFor(me));
    else notify('Still in review', 'We will notify you as soon as your account is approved.');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      {suspended ? <ShieldAlert color={colors.danger} size={56} /> : <Hourglass color={colors.amber} size={56} />}
      <T variant="h1">{suspended ? 'Account suspended' : 'Your profile is in review'}</T>
      <T variant="muted">
        {suspended
          ? 'Your account has been suspended by the Tazonix team. Contact support@tazonix.com if you think this is a mistake.'
          : 'Our team reviews every new account to keep Tazonix safe. Meanwhile you can complete your profile and browse competitions.'}
      </T>
      {!suspended ? (
        <>
          <GradientButton title="Check status" onPress={check} loading={loading} />
          <GradientButton
            title="Complete my profile"
            variant="outline"
            onPress={() => router.push(isSeeker(user) ? '/org-edit' : '/profile-edit')}
          />
          <GradientButton title="Browse while I wait" variant="ghost" onPress={() => router.replace(isSeeker(user) ? '/dashboard' : '/home')} />
        </>
      ) : null}
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
