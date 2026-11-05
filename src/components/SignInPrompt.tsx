import React from 'react';
import { router, usePathname } from 'expo-router';
import { EmptyState, GradientButton, Screen } from './ui';

export function SignInPrompt({ title = 'Sign in to continue', message }: { title?: string; message?: string }) {
  const pathname = usePathname();
  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <EmptyState
        title={title}
        message={message ?? 'Create a free Tazonix account or sign in to unlock this.'}
        action={
          <>
            <GradientButton title="Sign in" onPress={() => router.push({ pathname: '/sign-in', params: { returnTo: pathname } })} />
            <GradientButton title="Create account" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push('/choose-role')} />
          </>
        }
      />
    </Screen>
  );
}
