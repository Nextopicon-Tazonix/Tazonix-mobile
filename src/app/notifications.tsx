import React, { useEffect } from 'react';
import { router, Stack, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Notification } from '@/api/types';
import { Card, EmptyState, ErrorView, Loading, Row, Screen, T } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { timeAgo } from '@/lib/format';
import { colors } from '@/theme';

/** Map notification payloads to in-app destinations. */
function targetOf(n: Notification): Href | null {
  const d = n.data ?? {};
  if (typeof d.entryId === 'string') return `/entry/${d.entryId}`;
  if (typeof d.competitionSlug === 'string') return `/competition/${d.competitionSlug}`;
  if (typeof d.competitionId === 'string') return `/competition/${d.competitionId}`;
  if (typeof d.conversationId === 'string') return `/conversation/${d.conversationId}`;
  if (typeof d.opportunityId === 'string') return `/opportunity/${d.opportunityId}`;
  if (n.type.startsWith('wallet') || n.type.includes('reward') || n.type.includes('payout')) return '/wallet';
  return null;
}

export default function Notifications() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<Notification[]>('/notifications'), enabled: !!user });
  const readAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const hasUnread = !!q.data?.some((n) => !n.readAt);
  useEffect(() => {
    if (hasUnread) {
      const t = setTimeout(() => readAll.mutate(), 1500);
      return () => clearTimeout(t);
    }
  }, [hasUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <SignInPrompt />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.length ? (
        <EmptyState title="You're all caught up" />
      ) : (
        q.data.map((n) => {
          const href = targetOf(n);
          return (
            <Card key={n.id} onPress={href ? () => router.push(href) : undefined} style={[{ gap: 4 }, !n.readAt && { borderColor: colors.amber }]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T variant="h3" style={{ flex: 1 }}>
                  {n.title}
                </T>
                <T variant="small">{timeAgo(n.createdAt)}</T>
              </Row>
              <T variant="muted">{n.body}</T>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
