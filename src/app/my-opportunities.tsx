import React from 'react';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Opportunity } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Loading, Screen } from '@/components/ui';
import { OpportunityCard } from '@/components/cards';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';

export default function MyOpportunities() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ['my-opportunities'], queryFn: () => api.list<Opportunity>('/me/opportunities'), enabled: !!user });
  if (!user) return <SignInPrompt />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'My opportunities' }} />
      <GradientButton title="Post new opportunity" onPress={() => router.push('/opportunity/new')} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState title="Nothing posted yet" />
      ) : (
        q.data.items.map((o) => <OpportunityCard key={o.id} opportunity={o} />)
      )}
    </Screen>
  );
}
