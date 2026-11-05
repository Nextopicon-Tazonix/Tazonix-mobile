import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { api } from '@/api/client';
import type { TalentCard as Talent } from '@/api/types';
import { EmptyState, ErrorView, GradientButton, Loading, Screen } from '@/components/ui';
import { TalentCard } from '@/components/cards';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function Shortlist() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['shortlist'], queryFn: () => api.get<Talent[]>('/shortlist'), enabled: !!user });
  const remove = useMutation({
    mutationFn: (talentId: string) => api.del(`/shortlist/${talentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shortlist'] }),
    onError: (e) => showError(e),
  });
  if (!user) return <SignInPrompt title="Your shortlist" />;

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : !q.data?.length ? (
        <EmptyState
          title="Your shortlist is empty"
          message="Save talent from their profile to compare and contact them later."
          action={<GradientButton title="Discover talent" onPress={() => router.push('/find-talent')} />}
        />
      ) : (
        q.data.map((t) => (
          <TalentCard
            key={t.id}
            talent={t}
            right={
              <Pressable onPress={() => remove.mutate(t.id)} hitSlop={10} accessibilityLabel={`Remove ${t.displayName} from shortlist`}>
                <X color={colors.textMuted} size={20} />
              </Pressable>
            }
          />
        ))
      )}
    </Screen>
  );
}
