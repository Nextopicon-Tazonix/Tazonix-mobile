import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Competition, Opportunity, OpportunityType } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Input, Loading, Row, Screen, Segmented, Tag } from '@/components/ui';
import { CompetitionCard, OpportunityCard } from '@/components/cards';
import { useGenres } from '@/api/hooks';
import { titleCase } from '@/lib/format';

const types: OpportunityType[] = ['AUDITION', 'GIG', 'CASTING', 'JOB', 'COLLAB'];

export default function Discover() {
  const [tab, setTab] = useState<'opportunities' | 'competitions'>('opportunities');
  const [q, setQ] = useState('');
  const [type, setType] = useState<OpportunityType | null>(null);
  const [genreId, setGenreId] = useState<string | null>(null);
  const genres = useGenres();

  const opps = useInfiniteQuery({
    queryKey: ['opportunities', { q, type, genreId }],
    queryFn: ({ pageParam }) => api.list<Opportunity>('/opportunities', { q, type, genreId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.page.hasMore ? (last.page.nextCursor ?? undefined) : undefined),
    enabled: tab === 'opportunities',
  });
  const comps = useInfiniteQuery({
    queryKey: ['competitions', { q, genreId }],
    queryFn: ({ pageParam }) => api.list<Competition>('/competitions', { q, genreId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.page.hasMore ? (last.page.nextCursor ?? undefined) : undefined),
    enabled: tab === 'competitions',
  });
  const active = tab === 'opportunities' ? opps : comps;
  const oppItems = opps.data?.pages.flatMap((p) => p.items) ?? [];
  const compItems = comps.data?.pages.flatMap((p) => p.items) ?? [];
  const count = tab === 'opportunities' ? oppItems.length : compItems.length;

  return (
    <Screen onRefresh={() => active.refetch()} refreshing={active.isRefetching}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'opportunities', label: 'Opportunities' },
          { value: 'competitions', label: 'Competitions' },
        ]}
      />
      <Input placeholder="Search by title or keyword" value={q} onChangeText={setQ} returnKeyType="search" />
      {tab === 'opportunities' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row>
            {types.map((t) => (
              <Tag key={t} label={titleCase(t)} selected={type === t} onPress={() => setType(type === t ? null : t)} />
            ))}
          </Row>
        </ScrollView>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          {(genres.data ?? []).map((g) => (
            <Tag key={g.id} label={g.name} selected={genreId === g.id} onPress={() => setGenreId(genreId === g.id ? null : g.id)} />
          ))}
        </Row>
      </ScrollView>

      {active.isLoading ? (
        <Loading />
      ) : active.error ? (
        <ErrorView error={active.error} onRetry={active.refetch} />
      ) : !count ? (
        <EmptyState title="Nothing found" message="Try a different search or filter." />
      ) : tab === 'opportunities' ? (
        oppItems.map((o) => <OpportunityCard key={o.id} opportunity={o} />)
      ) : (
        compItems.map((c) => <CompetitionCard key={c.id} competition={c} />)
      )}
      {active.hasNextPage ? (
        <GradientButton title="Load more" variant="ghost" loading={active.isFetchingNextPage} onPress={() => active.fetchNextPage()} />
      ) : null}
    </Screen>
  );
}
