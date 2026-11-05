import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Music, PlayCircle } from 'lucide-react-native';
import { absoluteUrl } from '@/api/client';
import type { Media } from '@/api/types';
import { colors, radius } from '@/theme';

function Player({ uri, audio }: { uri: string; audio?: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return (
    <View>
      {audio ? (
        <View style={[styles.box, styles.center, { height: 120 }]}>
          <Music color={colors.purple} size={40} />
        </View>
      ) : null}
      <VideoView
        player={player}
        style={audio ? { height: 48 } : styles.box}
        nativeControls
        contentFit="contain"
        allowsPictureInPicture
      />
    </View>
  );
}

function Processing({ media }: { media: Media }) {
  const label =
    media.status === 'HELD' ? 'Under review' : media.status === 'BLOCKED' ? 'Removed' : media.status === 'FAILED' ? 'Processing failed' : 'Processing…';
  return (
    <View style={[styles.box, styles.center, { gap: 8 }]}>
      {media.status === 'PROCESSING' || media.status === 'PENDING' ? <ActivityIndicator color={colors.blue} /> : null}
      <Text style={{ color: colors.textMuted, fontFamily: 'Montserrat_600SemiBold' }}>{label}</Text>
    </View>
  );
}

/** Full media renderer used on entry/portfolio detail. Videos stream over HLS when available. */
export function MediaView({ media }: { media: Media | null }) {
  if (media && media.status !== 'READY') return <Processing media={media} />;
  const uri = absoluteUrl(media?.playbackUrl ?? media?.url);
  if (!media || !uri) {
    return (
      <View style={[styles.box, styles.center]}>
        <PlayCircle color={colors.textFaint} size={48} />
      </View>
    );
  }
  if (media.kind === 'IMAGE') return <Image source={{ uri }} style={styles.box} contentFit="contain" />;
  return <Player uri={uri} audio={media.kind === 'AUDIO'} />;
}

/** Lightweight thumbnail for lists (no player instance). */
export function MediaThumb({ media, height = 160 }: { media: Media | null; height?: number }) {
  const uri = absoluteUrl(media?.kind === 'IMAGE' ? media?.url : media?.posterUrl);
  if (uri && media?.kind === 'IMAGE') return <Image source={{ uri }} style={[styles.thumb, { height }]} contentFit="cover" />;
  if (uri && media?.kind === 'VIDEO') {
    return (
      <View style={[styles.thumb, { height }]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <PlayCircle color={colors.text} size={40} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.thumb, styles.center, { height }]}>
      {media?.kind === 'AUDIO' ? <Music color={colors.purple} size={36} /> : <PlayCircle color={colors.text} size={40} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: radius.lg, overflow: 'hidden' },
  thumb: { width: '100%', overflow: 'hidden', backgroundColor: colors.surfaceAlt, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
});
