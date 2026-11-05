import React from 'react';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, EmptyState, ErrorView, ListRow, Loading, Screen, T } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date, titleCase } from '@/lib/format';
import { colors } from '@/theme';

interface Points {
  total: number;
  events: { id: string; type: string; points: number; createdAt: string }[];
}

export default function PointsScreen() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ['points'], queryFn: () => api.get<Points>('/me/points'), enabled: !!user });
  if (!user) return <SignInPrompt />;
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'Points' }} />
      <Card style={{ borderColor: colors.amber }}>
        <T variant="small">Total engagement points</T>
        <T variant="h1" style={{ color: colors.amber }}>
          {q.data.total}
        </T>
        <T variant="muted">Earn points by voting, commenting and entering competitions. Points are not cash.</T>
      </Card>
      {q.data.events.length ? (
        q.data.events.map((e) => (
          <ListRow
            key={e.id}
            title={titleCase(e.type)}
            subtitle={date(e.createdAt)}
            right={<T style={{ color: e.points >= 0 ? colors.success : colors.danger, fontFamily: 'Montserrat_700Bold' }}>{e.points >= 0 ? `+${e.points}` : e.points}</T>}
          />
        ))
      ) : (
        <EmptyState title="No points yet" />
      )}
    </Screen>
  );
}
