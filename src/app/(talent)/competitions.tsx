import React, { useState } from 'react';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CompPhase, Competition } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Loading, Screen, Segmented } from '@/components/ui';
import { CompetitionCard } from '@/components/cards';
import { useAuth } from '@/store/auth';

type Filter = CompPhase | 'ALL';

export default function Competitions() {
  const user = useAuth((s) => s.user);
  const [phase, setPhase] = useState<Filter>('ALL');
  const q = useInfiniteQuery({
    queryKey: ['competitions', 'list', phase],
    queryFn: ({ pageParam }) => api.list<Competition>('/competitions', { phase: phase === 'ALL' ? undefined : phase, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.page.hasMore ? (last.page.nextCursor ?? undefined) : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Segmented<Filter>
        value={phase}
        onChange={setPhase}
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'SUBMISSIONS_OPEN', label: 'Enter' },
          { value: 'VOTING', label: 'Vote' },
          { value: 'CLOSED', label: 'Results' },
        ]}
      />
      {user?.roles.includes('TALENT') ? (
        <GradientButton title="My entries" variant="ghost" small onPress={() => router.push('/my-entries')} />
      ) : null}
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !items.length ? (
        <EmptyState title="No competitions here yet" />
      ) : (
        items.map((c) => <CompetitionCard key={c.id} competition={c} />)
      )}
      {q.hasNextPage ? (
        <GradientButton title="Load more" variant="ghost" loading={q.isFetchingNextPage} onPress={() => q.fetchNextPage()} />
      ) : null}
    </Screen>
  );
}
