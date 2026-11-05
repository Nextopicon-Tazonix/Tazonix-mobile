import React from 'react';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { EntryCard as Entry } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Loading, Screen } from '@/components/ui';
import { EntryCard } from '@/components/cards';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';

export default function MyEntries() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ['my-entries'], queryFn: () => api.list<Entry>('/me/entries'), enabled: !!user });
  if (!user) return <SignInPrompt />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'My entries' }} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState
          title="No entries yet"
          message="Find a competition that's open for submissions and show the world what you've got."
          action={<GradientButton title="Browse competitions" onPress={() => router.push('/competitions')} />}
        />
      ) : (
        q.data.items.map((e) => <EntryCard key={e.id} entry={e} />)
      )}
    </Screen>
  );
}
