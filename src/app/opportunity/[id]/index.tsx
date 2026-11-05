import React, { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Opportunity } from '@/api/types';
import { Avatar, Card, ErrorView, GradientButton, Input, Loading, Row, Screen, T, Tag } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { date, titleCase } from '@/lib/format';
import { notify, showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function OpportunityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const q = useQuery({ queryKey: ['opportunity', id], queryFn: () => api.get<Opportunity>(`/opportunities/${id}`) });

  const apply = useMutation({
    mutationFn: () => api.post(`/opportunities/${id}/apply`, { message: message.trim() }),
    onSuccess: () => {
      notify('Application sent', 'The organizer will review your profile and get back to you.');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: (e) => showError(e, 'Could not apply'),
  });
  const close = useMutation({
    mutationFn: () => api.patch(`/opportunities/${id}`, { closed: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      qc.invalidateQueries({ queryKey: ['my-opportunities'] });
    },
    onError: (e) => showError(e),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const o = q.data;
  const isOwner = user?.id === o.owner.id;
  const isTalent = !user || user.roles.includes('TALENT');

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: titleCase(o.type) }} />
      <Row style={{ flexWrap: 'wrap' }}>
        <Tag label={titleCase(o.type)} color={colors.purple} />
        {o.genre ? <Tag label={o.genre.name} /> : null}
        {o.remote ? <Tag label="Remote" color={colors.blue} /> : null}
        {o.closed ? <Tag label="Closed" color={colors.danger} /> : null}
      </Row>
      <T variant="h1">{o.title}</T>
      <Row gap={10}>
        <Avatar uri={o.owner.avatarUrl} name={o.owner.displayName} size={32} />
        <T variant="muted">{o.owner.displayName}</T>
      </Row>
      <Card style={{ gap: 6 }}>
        <T variant="small">Location</T>
        <T>{o.remote ? 'Remote' : [o.city, o.country].filter(Boolean).join(', ') || 'Anywhere'}</T>
        {o.compensation ? (
          <>
            <T variant="small">Compensation</T>
            <T style={{ color: colors.amber, fontFamily: 'Montserrat_700Bold' }}>{o.compensation}</T>
          </>
        ) : null}
        {o.deadline ? (
          <>
            <T variant="small">Apply by</T>
            <T>{date(o.deadline)}</T>
          </>
        ) : null}
        <T variant="small">{o.applicationCount} applicants · posted {date(o.createdAt)}</T>
      </Card>
      <Card>
        <T variant="muted">{o.description}</T>
      </Card>

      {isOwner ? (
        <>
          <GradientButton title={`View applications (${o.applicationCount})`} onPress={() => router.push(`/opportunity/${o.id}/applications`)} />
          {!o.closed ? <GradientButton title="Close opportunity" variant="danger" loading={close.isPending} onPress={() => close.mutate()} /> : null}
        </>
      ) : o.myApplicationStatus ? (
        <Card style={{ borderColor: colors.success }}>
          <T variant="h3">Application status: {titleCase(o.myApplicationStatus)}</T>
        </Card>
      ) : !o.closed && isTalent ? (
        <Card style={{ gap: 8 }}>
          <T variant="h3">Apply</T>
          <Input
            placeholder="Tell them why you're a great fit (your profile and portfolio are shared automatically)"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <GradientButton title="Send application" loading={apply.isPending} onPress={() => requireAuth(() => apply.mutate())} />
        </Card>
      ) : null}
    </Screen>
  );
}
