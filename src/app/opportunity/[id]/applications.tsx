import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Application, AppStatus } from '@/api/types';
import { Card, EmptyState, ErrorView, GradientButton, Loading, Row, Screen, T, Tag } from '@/components/ui';
import { TalentCard } from '@/components/cards';
import { date, titleCase } from '@/lib/format';
import { showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function Applications() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['applications', id], queryFn: () => api.list<Application>(`/opportunities/${id}/applications`) });
  const update = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: AppStatus }) => api.patch(`/applications/${appId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', id] }),
    onError: (e) => showError(e),
  });

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'Applications' }} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState title="No applications yet" />
      ) : (
        q.data.items.map((a) => (
          <Card key={a.id} style={{ gap: 8, padding: 10 }}>
            <TalentCard talent={a.talent} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Tag label={titleCase(a.status)} color={a.status === 'HIRED' ? colors.success : a.status === 'REJECTED' ? colors.danger : colors.blue} />
              <T variant="small">{date(a.createdAt)}</T>
            </Row>
            {a.message ? <T variant="muted">{a.message}</T> : null}
            {a.status !== 'HIRED' && a.status !== 'REJECTED' && a.status !== 'WITHDRAWN' ? (
              <Row>
                {a.status === 'SUBMITTED' ? (
                  <GradientButton small title="Shortlist" variant="outline" style={{ flex: 1 }} onPress={() => update.mutate({ appId: a.id, status: 'SHORTLISTED' })} />
                ) : null}
                <GradientButton small title="Hire" style={{ flex: 1 }} onPress={() => update.mutate({ appId: a.id, status: 'HIRED' })} />
                <GradientButton small title="Reject" variant="ghost" style={{ flex: 1 }} onPress={() => update.mutate({ appId: a.id, status: 'REJECTED' })} />
              </Row>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
