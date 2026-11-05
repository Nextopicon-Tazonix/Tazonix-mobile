import React from 'react';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Application } from '@/api/types';
import { Card, EmptyState, ErrorView, GradientButton, Loading, Row, Screen, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date, titleCase } from '@/lib/format';
import { colors } from '@/theme';

export default function MyApplications() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ['my-applications'], queryFn: () => api.list<Application>('/me/applications'), enabled: !!user });
  if (!user) return <SignInPrompt />;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'My applications' }} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState
          title="No applications yet"
          action={<GradientButton title="Find opportunities" onPress={() => router.push('/discover')} />}
        />
      ) : (
        q.data.items.map((a) => (
          <Card key={a.id} onPress={() => router.push(`/opportunity/${a.opportunity.id}`)} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                {a.opportunity.title}
              </T>
              <Tag label={titleCase(a.status)} color={a.status === 'HIRED' ? colors.success : a.status === 'REJECTED' ? colors.danger : colors.blue} />
            </Row>
            <T variant="small">Applied {date(a.createdAt)}</T>
          </Card>
        ))
      )}
    </Screen>
  );
}
