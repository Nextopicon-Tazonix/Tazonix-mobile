import type { Href } from 'expo-router';
import { api } from '@/api/client';
import type { AuthResponse, Me } from '@/api/types';
import { isSeeker, useAuth } from '@/store/auth';
import { queryClient } from '@/lib/queryClient';

export async function startSession(res: AuthResponse) {
  await useAuth.getState().setTokens(res.accessToken, res.refreshToken);
  useAuth.getState().setUser(res.user);
}

export async function refreshMe(): Promise<Me | null> {
  if (!useAuth.getState().accessToken) return null;
  try {
    const me = await api.get<Me>('/me');
    useAuth.getState().setUser(me);
    return me;
  } catch {
    return useAuth.getState().user;
  }
}

export async function signOut() {
  const { refreshToken, clear } = useAuth.getState();
  if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => undefined);
  await clear();
  queryClient.clear();
}

/** Where a user should land after auth, based on status and role. */
export function homeFor(user: Me | null): Href {
  if (!user) return '/welcome';
  if (user.status === 'PENDING_EMAIL') return '/verify-email';
  if (user.status === 'PENDING_REVIEW' || user.status === 'SUSPENDED') return '/pending-review';
  return isSeeker(user) ? '/dashboard' : '/home';
}
