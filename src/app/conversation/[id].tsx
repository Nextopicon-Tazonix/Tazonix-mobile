import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import { api } from '@/api/client';
import type { Conversation, Message } from '@/api/types';
import { EmptyState, ErrorView, Loading, T } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { timeAgo } from '@/lib/format';
import { showError } from '@/lib/notify';
import { colors, fonts, radius, space } from '@/theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  // Polling keeps the thread fresh until the WebSocket gateway lands.
  const messages = useQuery({
    queryKey: ['messages', id],
    queryFn: () => api.list<Message>(`/conversations/${id}/messages`, { limit: 50 }),
    refetchInterval: 5000,
  });
  const convos = useQuery({ queryKey: ['conversations'], queryFn: () => api.list<Conversation>('/conversations') });
  const convo = convos.data?.items.find((c) => c.id === id);
  const other = convo?.participants.find((p) => p.id !== me?.id);

  const send = useMutation({
    mutationFn: (text: string) => api.post<Message>(`/conversations/${id}/messages`, { body: text }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['messages', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (e) => showError(e, 'Message not sent'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen options={{ title: other?.displayName ?? 'Conversation' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {messages.isLoading ? (
          <Loading />
        ) : messages.error ? (
          <ErrorView error={messages.error} onRetry={messages.refetch} />
        ) : (
          <FlatList
            inverted
            data={messages.data?.items ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: space.lg, gap: space.sm }}
            ListEmptyComponent={<EmptyState title="Say hello 👋" />}
            renderItem={({ item }) => {
              const mine = item.senderId === me?.id;
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <T style={{ color: colors.text }}>{item.body}</T>
                  <T variant="small" style={{ alignSelf: 'flex-end', marginTop: 2, fontSize: 10 }}>
                    {timeAgo(item.createdAt)}
                  </T>
                </View>
              );
            }}
          />
        )}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Write a message…"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={() => body.trim() && send.mutate(body.trim())}
            disabled={!body.trim() || send.isPending}
            style={[styles.send, (!body.trim() || send.isPending) && { opacity: 0.5 }]}
            accessibilityLabel="Send"
          >
            <Send color={colors.text} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.purple, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});
