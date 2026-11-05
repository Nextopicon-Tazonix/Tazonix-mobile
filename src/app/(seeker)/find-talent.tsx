import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { api } from '@/api/client';
import type { TalentCard as Talent } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Input, Loading, Row, Screen, Tag } from '@/components/ui';
import { TalentCard } from '@/components/cards';
import { useGenres } from '@/api/hooks';

export default function FindTalent() {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [genreId, setGenreId] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const genres = useGenres();

  const query = useInfiniteQuery({
    queryKey: ['discover', { q, country, city, genreId, available }],
    queryFn: ({ pageParam }) =>
      api.list<Talent>('/discover/talent', {
        q,
        country: country.trim().toUpperCase() || undefined,
        city: city.trim() || undefined,
        genreId,
        available: available || undefined,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.page.hasMore ? (last.page.nextCursor ?? undefined) : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <GradientButton title="AI Match: describe who you need" icon={<Sparkles color="#fff" size={18} />} onPress={() => router.push('/ai-match')} />
      <Input placeholder="Search name, skill or keyword" value={q} onChangeText={setQ} returnKeyType="search" />
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Country (CA, NG…)" value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Input placeholder="City" value={city} onChangeText={setCity} />
        </View>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row>
          <Tag label="Available now" selected={available} onPress={() => setAvailable(!available)} />
          {(genres.data ?? []).map((g) => (
            <Tag key={g.id} label={g.name} selected={genreId === g.id} onPress={() => setGenreId(genreId === g.id ? null : g.id)} />
          ))}
        </Row>
      </ScrollView>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorView error={query.error} onRetry={query.refetch} />
      ) : !items.length ? (
        <EmptyState title="No talent matches" message="Loosen your filters or try AI Match." />
      ) : (
        items.map((t) => <TalentCard key={t.id} talent={t} />)
      )}
      {query.hasNextPage ? (
        <GradientButton title="Load more" variant="ghost" loading={query.isFetchingNextPage} onPress={() => query.fetchNextPage()} />
      ) : null}
    </Screen>
  );
}
