import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Booking, Conversation, Invitation } from '@/api/types';
import { Avatar, Card, EmptyState, ErrorView, GradientButton, Loading, Row, Screen, Segmented, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date, money, timeAgo, titleCase } from '@/lib/format';
import { showError } from '@/lib/notify';
import { colors } from '@/theme';

type Tab = 'messages' | 'invitations' | 'bookings';

const statusColor: Record<string, string> = {
  SENT: colors.blue,
  REQUESTED: colors.blue,
  ACCEPTED: colors.success,
  COMPLETED: colors.success,
  DECLINED: colors.danger,
  CANCELLED: colors.textFaint,
};

function Conversations() {
  const me = useAuth((s) => s.user)!;
  const q = useQuery({ queryKey: ['conversations'], queryFn: () => api.list<Conversation>('/conversations'), refetchInterval: 15_000 });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  if (!items.length) return <EmptyState title="No conversations yet" message="Accepted invitations and bookings open a conversation here." />;
  return (
    <>
      {items.map((c) => {
        const other = c.participants.find((p) => p.id !== me.id) ?? c.participants[0];
        return (
          <Card key={c.id} onPress={() => router.push(`/conversation/${c.id}`)}>
            <Row gap={12}>
              <Avatar uri={other?.avatarUrl} name={other?.displayName} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                    {other?.displayName ?? 'Conversation'}
                  </T>
                  {c.lastMessage ? <T variant="small">{timeAgo(c.lastMessage.createdAt)}</T> : null}
                </Row>
                <T variant="muted" numberOfLines={1}>
                  {c.lastMessage?.body ?? 'No messages yet'}
                </T>
              </View>
              {c.unreadCount > 0 ? <Tag label={String(c.unreadCount)} color={colors.magenta} /> : null}
            </Row>
          </Card>
        );
      })}
    </>
  );
}

function Invitations() {
  const me = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const isTalent = me.roles.includes('TALENT');
  const [box, setBox] = useState<'received' | 'sent'>(isTalent ? 'received' : 'sent');
  const q = useQuery({ queryKey: ['invitations', box], queryFn: () => api.list<Invitation>('/invitations', { box }) });
  const respond = useMutation({
    mutationFn: ({ id, response }: { id: string; response: 'ACCEPTED' | 'DECLINED' }) => api.post<Invitation>(`/invitations/${id}/respond`, { response }),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      if (inv?.status === 'ACCEPTED' && inv.conversationId) router.push(`/conversation/${inv.conversationId}`);
    },
    onError: (e) => showError(e),
  });

  return (
    <>
      <Segmented
        value={box}
        onChange={setBox}
        options={[
          { value: 'received', label: 'Received' },
          { value: 'sent', label: 'Sent' },
        ]}
      />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.items.length ? (
        <EmptyState title="No invitations" message={box === 'received' ? 'Invitations from agencies and brands appear here.' : 'Invite talent from their profile.'} />
      ) : (
        q.data.items.map((inv) => {
          const other = box === 'received' ? inv.sender : inv.talent;
          return (
            <Card key={inv.id} style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={8} style={{ flex: 1 }}>
                  <Avatar uri={other.avatarUrl} name={other.displayName} size={32} />
                  <T variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                    {other.displayName}
                  </T>
                </Row>
                <Tag label={titleCase(inv.status)} color={statusColor[inv.status]} />
              </Row>
              <T style={{ fontFamily: 'Montserrat_600SemiBold' }}>
                {titleCase(inv.type)} · {inv.subject}
              </T>
              <T variant="muted">{inv.message}</T>
              {inv.responseMessage ? <T variant="small">Reply: {inv.responseMessage}</T> : null}
              <T variant="small">{date(inv.createdAt)}</T>
              {box === 'received' && inv.status === 'SENT' ? (
                <Row>
                  <GradientButton small title="Accept" style={{ flex: 1 }} onPress={() => respond.mutate({ id: inv.id, response: 'ACCEPTED' })} />
                  <GradientButton small title="Decline" variant="ghost" style={{ flex: 1 }} onPress={() => respond.mutate({ id: inv.id, response: 'DECLINED' })} />
                </Row>
              ) : inv.conversationId ? (
                <GradientButton small title="Open conversation" variant="outline" onPress={() => router.push(`/conversation/${inv.conversationId}`)} />
              ) : null}
            </Card>
          );
        })
      )}
    </>
  );
}

function Bookings() {
  const me = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['bookings'], queryFn: () => api.list<Booking>('/bookings') });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' | 'cancel' | 'complete' }) => api.post(`/bookings/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
    onError: (e) => showError(e),
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorView error={q.error} onRetry={q.refetch} />;
  if (!q.data?.items.length) return <EmptyState title="No bookings yet" message="Booking requests between talent and seekers show up here." />;
  return (
    <>
      {q.data.items.map((b) => {
        const asTalent = b.talent.id === me.id;
        const other = asTalent ? b.seeker : b.talent;
        return (
          <Card key={b.id} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                {asTalent ? `From ${other.displayName}` : `With ${other.displayName}`}
              </T>
              <Tag label={titleCase(b.status)} color={statusColor[b.status]} />
            </Row>
            <T>
              {date(b.eventDate)} · {b.venue}
            </T>
            <T style={{ color: colors.amber, fontFamily: 'Montserrat_700Bold' }}>{money(b.feeMinor, b.currency)}</T>
            {b.details ? <T variant="muted">{b.details}</T> : null}
            <Row>
              {asTalent && b.status === 'REQUESTED' ? (
                <>
                  <GradientButton small title="Accept" style={{ flex: 1 }} onPress={() => act.mutate({ id: b.id, action: 'accept' })} />
                  <GradientButton small title="Decline" variant="ghost" style={{ flex: 1 }} onPress={() => act.mutate({ id: b.id, action: 'decline' })} />
                </>
              ) : null}
              {!asTalent && (b.status === 'REQUESTED' || b.status === 'ACCEPTED') ? (
                <GradientButton small title="Cancel" variant="danger" style={{ flex: 1 }} onPress={() => act.mutate({ id: b.id, action: 'cancel' })} />
              ) : null}
              {!asTalent && b.status === 'ACCEPTED' ? (
                <GradientButton small title="Mark complete" style={{ flex: 1 }} onPress={() => act.mutate({ id: b.id, action: 'complete' })} />
              ) : null}
            </Row>
          </Card>
        );
      })}
    </>
  );
}

export function InboxScreen() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('messages');
  if (!user) return <SignInPrompt title="Your inbox" message="Sign in to see messages, invitations and bookings." />;
  return (
    <Screen onRefresh={() => qc.invalidateQueries()} refreshing={false}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'messages', label: 'Messages' },
          { value: 'invitations', label: 'Invitations' },
          { value: 'bookings', label: 'Bookings' },
        ]}
      />
      {tab === 'messages' ? <Conversations /> : tab === 'invitations' ? <Invitations /> : <Bookings />}
    </Screen>
  );
}
