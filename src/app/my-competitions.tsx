import React from 'react';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Competition } from '@/api/types';
import { Card, EmptyState, ErrorView, GradientButton, Loading, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date, phaseLabel, titleCase } from '@/lib/format';
import { colors } from '@/theme';

const statusColor: Record<string, string> = {
  PENDING_REVIEW: colors.amber,
  APPROVED: colors.success,
  WINNER_CONFIRMED: colors.success,
  REJECTED: colors.danger,
  CANCELLED: colors.textFaint,
  DRAFT: colors.textFaint,
};

export default function MyCompetitions() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ['my-competitions'], queryFn: () => api.list<Competition>('/me/competitions'), enabled: !!user });
  if (!user) return <SignInPrompt />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'My competitions' }} />
      <GradientButton title="Create competition" onPress={() => router.push('/competition/new')} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState title="No competitions yet" message="Competitions are reviewed by the Tazonix team before going live." />
      ) : (
        q.data.items.map((c) => (
          <Card key={c.id} onPress={() => router.push(`/competition/${c.slug}`)} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                {c.title}
              </T>
              <Tag label={titleCase(c.status)} color={statusColor[c.status]} />
            </Row>
            <T variant="small">
              {c.status === 'APPROVED' ? `${phaseLabel[c.phase]} · ` : ''}
              {c.entryCount} entries · starts {date(c.startsAt)}
            </T>
            {c.status === 'REJECTED' && c.rejectionReason ? (
              <T variant="muted" style={{ color: colors.danger }}>
                Reason: {c.rejectionReason}
              </T>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
