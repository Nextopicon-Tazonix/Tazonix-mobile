import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { api, ApiError } from '@/api/client';
import type { Media, MediaKind } from '@/api/types';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  kind: MediaKind;
}

const guessMime = (name: string, kind: MediaKind) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic',
    mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', aac: 'audio/aac',
  };
  return (ext && map[ext]) || (kind === 'IMAGE' ? 'image/jpeg' : kind === 'VIDEO' ? 'video/mp4' : 'audio/mpeg');
};

/** Pick an image or video from the library. Returns null when cancelled or permission denied. */
export async function pickMedia(kinds: ('IMAGE' | 'VIDEO')[]): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const mediaTypes: ImagePicker.MediaType[] = kinds.map((k) => (k === 'IMAGE' ? 'images' : 'videos'));
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes, quality: 0.85, allowsEditing: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  const kind: MediaKind = a.type === 'video' ? 'VIDEO' : 'IMAGE';
  const name = a.fileName ?? `upload-${Date.now()}.${kind === 'VIDEO' ? 'mp4' : 'jpg'}`;
  return { uri: a.uri, name, mimeType: a.mimeType ?? guessMime(name, kind), kind };
}

export async function pickAudio(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? guessMime(a.name, 'AUDIO'), kind: 'AUDIO' };
}

interface UploadTicket {
  media: Media;
  upload: { url: string; method: 'PUT'; headers: Record<string, string>; expiresAt: string };
}

/** PUT the bytes straight to S3 (XHR so we get progress events; works on native and web). */
function putToS3(ticket: UploadTicket['upload'], blob: Blob, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.method, ticket.url);
    Object.entries(ticket.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(`Upload failed (${xhr.status})`, 'UPLOAD_FAILED', xhr.status)));
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 'NETWORK_ERROR', 0));
    xhr.send(blob);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polls until processing finishes. Throws if the file was rejected or could not be processed. */
export async function waitForMedia(id: string, timeoutMs = 90_000): Promise<Media> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const m = await api.get<Media>(`/media/${id}`);
    if (m.status === 'READY') return m;
    if (m.status === 'BLOCKED') throw new ApiError('This file was rejected by our content rules.', 'MEDIA_BLOCKED', 422);
    if (m.status === 'FAILED') throw new ApiError('We could not process this file. Please try another one.', 'MEDIA_FAILED', 422);
    if (m.status === 'HELD') throw new ApiError('This file is being reviewed by our team. We will notify you when it is approved.', 'MEDIA_HELD', 202);
    await sleep(1500);
  }
  throw new ApiError('Still processing. It will appear once it is ready.', 'MEDIA_PROCESSING', 202);
}

export interface UploadOptions {
  onProgress?: (fraction: number) => void;
  /** Wait until processed (use for avatars and sponsor images, which must be READY before use). */
  waitUntilReady?: boolean;
}

/**
 * Direct-to-S3 upload: the API issues a one-time signed URL, the file goes straight to S3, then the
 * API verifies it and queues processing (video -> HLS, photo metadata stripping, moderation).
 */
export async function uploadMedia(file: PickedFile, opts: UploadOptions = {}): Promise<Media> {
  const blob = await (await fetch(file.uri)).blob();
  const mimeType = file.mimeType === 'image/jpg' ? 'image/jpeg' : file.mimeType;
  const ticket = await api.post<UploadTicket>('/media/uploads', { kind: file.kind, mimeType, sizeBytes: blob.size, fileName: file.name });
  await putToS3(ticket.upload, blob, opts.onProgress);
  const media = await api.post<Media>(`/media/${ticket.media.id}/complete`);
  return opts.waitUntilReady ? waitForMedia(media.id) : media;
}
