import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, Heart, MessageCircle, Share2, Trash2, Trophy, Vote } from 'lucide-react-native';
import { ApiError, api } from '@/api/client';
import type { Comment, EntryDetail } from '@/api/types';
import { Avatar, Card, ErrorView, GradientButton, Input, Loading, Row, Screen, SectionHeader, T, Tag } from '@/components/ui';
import { MediaView } from '@/components/MediaView';
import { useAuth } from '@/store/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { pickMedia, uploadMedia } from '@/lib/upload';
import { countdown, phaseLabel, timeAgo } from '@/lib/format';
import { confirm, notify, showError } from '@/lib/notify';
import { colors, space } from '@/theme';

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [replacing, setReplacing] = useState(false);

  const q = useQuery({
    queryKey: ['entry', id],
    queryFn: () => api.get<EntryDetail>(`/entries/${id}`),
    // Check again while the video is processing so the entry flips to live on its own.
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 5000 : false),
  });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => api.list<Comment>(`/entries/${id}/comments`) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['entry', id] });
    qc.invalidateQueries({ queryKey: ['comments', id] });
    qc.invalidateQueries({ queryKey: ['competition-entries'] });
  };

  const vote = useMutation({
    mutationFn: () => api.post(`/entries/${id}/vote`, {}, { idempotent: true }),
    onSuccess: () => {
      notify('Vote counted ✅', 'Thanks for voting! You get one vote per competition.');
      refresh();
      qc.invalidateQueries({ queryKey: ['competition'] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'ALREADY_VOTED') notify('Already voted', 'You have already used your vote in this competition.');
      else if (e instanceof ApiError && e.code === 'WINDOW_CLOSED') notify('Voting is closed', 'Votes can only be cast during the voting window.');
      else showError(e, 'Vote failed');
    },
  });
  const like = useMutation({
    mutationFn: (liked: boolean) => (liked ? api.del(`/entries/${id}/like`) : api.post(`/entries/${id}/like`)),
    onSuccess: refresh,
    onError: (e) => showError(e),
  });
  const addComment = useMutation({
    mutationFn: () => api.post(`/entries/${id}/comments`, { body: comment.trim() }),
    onSuccess: () => {
      setComment('');
      refresh();
    },
    onError: (e) => showError(e),
  });
  const deleteComment = useMutation({ mutationFn: (cid: string) => api.del(`/comments/${cid}`), onSuccess: refresh, onError: (e) => showError(e) });
  const likeComment = useMutation({
    mutationFn: (c: Comment) => (c.likedByMe ? api.del(`/comments/${c.id}/like`) : api.post(`/comments/${c.id}/like`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', id] }),
    onError: (e) => showError(e),
  });
  const withdraw = useMutation({
    mutationFn: () => api.post(`/entries/${id}/withdraw`),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ['competition'] });
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      router.back();
    },
    onError: (e) => showError(e),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const e = q.data;
  const c = e.competition;
  const isOwner = user?.id === e.account.id;
  const canEdit = isOwner && c.phase === 'SUBMISSIONS_OPEN' && (e.status === 'PUBLISHED' || e.status === 'PROCESSING');
  const voteAvailable = c.phase === 'VOTING' && !isOwner && e.status === 'PUBLISHED';

  const replaceMedia = async () => {
    const accepted = c.acceptedMedia.filter((k): k is 'IMAGE' | 'VIDEO' => k !== 'AUDIO');
    const picked = await pickMedia(accepted.length ? accepted : ['VIDEO']);
    if (!picked) return;
    setReplacing(true);
    try {
      const media = await uploadMedia(picked);
      await api.patch(`/entries/${id}`, { mediaId: media.id });
      refresh();
      notify('Entry updated');
    } catch (err) {
      showError(err, 'Could not update entry');
    } finally {
      setReplacing(false);
    }
  };

  return (
    <Screen onRefresh={refresh} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: e.title }} />
      <MediaView media={e.media} />
      <Row style={{ flexWrap: 'wrap' }}>
        {e.isWinner ? <Tag label="🏆 Winner" color={colors.amber} /> : null}
        {e.status === 'PROCESSING' ? <Tag label="Processing" color={colors.amber} /> : null}
        {e.status === 'DISQUALIFIED' || e.status === 'WITHDRAWN' ? <Tag label={e.status === 'DISQUALIFIED' ? 'Disqualified' : 'Withdrawn'} color={colors.danger} /> : null}
        <Tag label={phaseLabel[c.phase]} color={colors.purple} />
      </Row>
      <T variant="h2">{e.title}</T>
      <Pressable onPress={() => router.push(`/talent/${e.account.handle}`)}>
        <Row gap={10}>
          <Avatar uri={e.account.avatarUrl} name={e.account.displayName} size={36} />
          <View style={{ flex: 1 }}>
            <T variant="h3">{e.account.displayName}</T>
            <T variant="small">@{e.account.handle}</T>
          </View>
        </Row>
      </Pressable>
      <Card onPress={() => router.push(`/competition/${c.slug}`)} style={{ padding: space.md }}>
        <Row gap={8}>
          <Trophy color={colors.amber} size={18} />
          <T style={{ flex: 1 }} numberOfLines={1}>
            {c.title}
          </T>
          {c.phase === 'VOTING' ? <T variant="small">{countdown(c.votingEndsAt)}</T> : null}
        </Row>
      </Card>

      <Row style={{ justifyContent: 'space-around', paddingVertical: space.sm }}>
        <Row gap={6}>
          <Vote color={e.votedByMe ? colors.amber : colors.textMuted} size={20} />
          <T variant="h3">{e.voteCount}</T>
        </Row>
        <Pressable onPress={() => requireAuth(() => like.mutate(e.likedByMe), { requireActive: false })} hitSlop={10} accessibilityLabel="Like">
          <Row gap={6}>
            <Heart color={e.likedByMe ? colors.magenta : colors.textMuted} fill={e.likedByMe ? colors.magenta : 'transparent'} size={20} />
            <T variant="h3">{e.likeCount}</T>
          </Row>
        </Pressable>
        <Row gap={6}>
          <MessageCircle color={colors.textMuted} size={20} />
          <T variant="h3">{e.commentCount}</T>
        </Row>
        <Pressable
          onPress={() => Share.share({ message: `Vote for "${e.title}" by ${e.account.displayName} on Tazonix: tazonix://entry/${e.id}` })}
          hitSlop={10}
          accessibilityLabel="Share"
        >
          <Share2 color={colors.textMuted} size={20} />
        </Pressable>
      </Row>

      {voteAvailable ? (
        e.votedByMe ? (
          <GradientButton title="You voted for this entry ✓" variant="ghost" disabled />
        ) : c.myVoteEntryId ? (
          <GradientButton title="You already voted in this competition" variant="ghost" disabled />
        ) : (
          <GradientButton title="Vote for this entry" loading={vote.isPending} onPress={() => requireAuth(() => vote.mutate())} />
        )
      ) : c.phase === 'SUBMISSIONS_OPEN' || c.phase === 'UPCOMING' ? (
        <T variant="small" style={{ textAlign: 'center' }}>
          Voting opens {new Date(c.submissionEndsAt).toLocaleString()}
        </T>
      ) : null}

      {canEdit ? (
        <Row>
          <GradientButton small title="Replace media" variant="outline" style={{ flex: 1 }} loading={replacing} onPress={replaceMedia} />
          <GradientButton
            small
            title="Withdraw"
            variant="danger"
            style={{ flex: 1 }}
            onPress={() => confirm('Withdraw entry?', 'Your entry will be removed from the competition.', () => withdraw.mutate(), 'Withdraw')}
          />
        </Row>
      ) : null}

      <SectionHeader title="Comments" />
      {user ? (
        <View>
          <Input placeholder="Add a comment…" value={comment} onChangeText={setComment} maxLength={500} />
          <GradientButton small title="Post" disabled={!comment.trim()} loading={addComment.isPending} onPress={() => requireAuth(() => addComment.mutate(), { requireActive: false })} />
        </View>
      ) : (
        <GradientButton small variant="ghost" title="Sign in to comment" onPress={() => requireAuth(() => undefined)} />
      )}
      {(comments.data?.items ?? []).map((cm) => (
        <Card key={cm.id} style={{ padding: space.md, gap: 6 }}>
          <Row gap={8}>
            <Avatar uri={cm.account.avatarUrl} name={cm.account.displayName} size={28} />
            <T variant="h3" style={{ flex: 1, fontSize: 14 }}>
              {cm.account.displayName}
            </T>
            <T variant="small">{timeAgo(cm.createdAt)}</T>
          </Row>
          <T>{cm.body}</T>
          <Row gap={16}>
            <Pressable onPress={() => requireAuth(() => likeComment.mutate(cm), { requireActive: false })} hitSlop={8}>
              <Row gap={4}>
                <Heart color={cm.likedByMe ? colors.magenta : colors.textMuted} size={14} />
                <T variant="small">{cm.likeCount}</T>
              </Row>
            </Pressable>
            {user?.id === cm.account.id ? (
              <Pressable onPress={() => deleteComment.mutate(cm.id)} hitSlop={8} accessibilityLabel="Delete comment">
                <Trash2 color={colors.textMuted} size={14} />
              </Pressable>
            ) : user ? (
              <Pressable onPress={() => router.push({ pathname: '/report', params: { targetType: 'COMMENT', targetId: cm.id } })} hitSlop={8} accessibilityLabel="Report comment">
                <Flag color={colors.textMuted} size={14} />
              </Pressable>
            ) : null}
          </Row>
        </Card>
      ))}

      {!isOwner ? (
        <Pressable
          style={{ alignSelf: 'center', marginTop: space.lg }}
          onPress={() => requireAuth(() => router.push({ pathname: '/report', params: { targetType: 'ENTRY', targetId: e.id } }), { requireActive: false })}
        >
          <Row gap={6}>
            <Flag color={colors.textFaint} size={14} />
            <T variant="small">Report this entry</T>
          </Row>
        </Pressable>
      ) : null}
    </Screen>
  );
}
