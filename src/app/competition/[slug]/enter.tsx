import React, { useState } from 'react';
import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Upload } from 'lucide-react-native';
import { ApiError, api } from '@/api/client';
import type { Competition, EntryCard, Media } from '@/api/types';
import { Card, ErrorView, GradientButton, Input, Loading, Row, Screen, T } from '@/components/ui';
import { MediaView } from '@/components/MediaView';
import { pickAudio, pickMedia, uploadMedia, type PickedFile } from '@/lib/upload';
import { countdown } from '@/lib/format';
import { notify, showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function EnterCompetition() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['competition', slug], queryFn: () => api.get<Competition>(`/competitions/${slug}`) });
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [media, setMedia] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const c = q.data;
  const accepted = c.acceptedMedia.length ? c.acceptedMedia : ['VIDEO'];

  if (c.myEntryId) return <Redirect href={`/entry/${c.myEntryId}`} />;

  const choose = async () => {
    const picked = accepted.includes('AUDIO') && !accepted.includes('VIDEO') && !accepted.includes('IMAGE')
      ? await pickAudio()
      : await pickMedia(accepted.filter((k): k is 'IMAGE' | 'VIDEO' => k !== 'AUDIO'));
    if (!picked) return;
    if (!accepted.includes(picked.kind)) return notify('Wrong file type', `This competition accepts: ${accepted.join(', ').toLowerCase()}.`);
    setFile(picked);
    setMedia(null);
    setUploading(true);
    try {
      setProgress(0);
      setMedia(await uploadMedia(picked, { onProgress: setProgress }));
    } catch (e) {
      setFile(null);
      showError(e, 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!media) return;
    setSubmitting(true);
    try {
      const entry = await api.post<EntryCard>(`/competitions/${c.id}/entries`, { title: title.trim(), mediaId: media.id }, { idempotent: true });
      qc.invalidateQueries({ queryKey: ['competition', slug] });
      qc.invalidateQueries({ queryKey: ['competition-entries'] });
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      notify('Entry submitted 🎉', entry.status === 'PROCESSING' ? 'Your video is processing. Your entry goes live automatically when it is ready.' : 'Good luck! Share your entry to collect votes when voting opens.');
      router.replace(`/entry/${entry.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ENTRY_ALREADY_EXISTS' && e.details?.entryId) {
        notify('You already entered', 'Opening your existing entry. You can replace the media before the deadline.');
        router.replace(`/entry/${e.details.entryId}`);
      } else showError(e, 'Could not submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Enter competition' }} />
      <T variant="h2">{c.title}</T>
      <T variant="muted">Submissions close {countdown(c.submissionEndsAt)}. One entry per talent. You can edit it before the deadline.</T>
      <Input label="Entry title" value={title} onChangeText={setTitle} placeholder="e.g. 'Ordinary People' acoustic cover" maxLength={120} />
      <Card style={{ gap: 10 }}>
        <T variant="h3">Your media</T>
        <T variant="small">
          Accepted: {accepted.join(', ').toLowerCase()}
          {c.maxDurationSec ? ` · max ${Math.round(c.maxDurationSec / 60)} min` : ''}
        </T>
        {media ? <MediaView media={media} /> : null}
        {file && !media && uploading ? <T variant="muted">Uploading {file.name}… {Math.round(progress * 100)}%</T> : null}
        {media ? (
          <Row gap={6}>
            <CheckCircle2 color={colors.success} size={18} />
            <T style={{ color: colors.success }}>
              {media.status === 'READY' ? 'Upload complete' : 'Uploaded. We finish processing after you submit, then your entry goes live.'}
            </T>
          </Row>
        ) : null}
        <GradientButton
          title={media ? 'Choose a different file' : 'Choose file'}
          variant="outline"
          icon={<Upload color={colors.text} size={18} />}
          loading={uploading}
          onPress={choose}
        />
      </Card>
      <GradientButton title="Submit entry" onPress={submit} loading={submitting} disabled={!media || !title.trim() || uploading} />
    </Screen>
  );
}
