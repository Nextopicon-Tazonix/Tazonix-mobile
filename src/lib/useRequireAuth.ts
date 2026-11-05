import { useCallback } from 'react';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/store/auth';
import { notify } from '@/lib/notify';

/**
 * Wraps a protected action. Guests are sent to sign-in with a returnTo path, so the
 * user lands back on the same screen after authenticating.
 */
export function useRequireAuth() {
  const user = useAuth((s) => s.user);
  const pathname = usePathname();
  return useCallback(
    (action: () => void, opts?: { requireActive?: boolean }) => {
      if (!user) {
        router.push({ pathname: '/sign-in', params: { returnTo: pathname } });
        return;
      }
      if (opts?.requireActive !== false && user.status !== 'ACTIVE') {
        notify('Account not active yet', 'Your account must be verified and approved before you can do this.');
        return;
      }
      action();
    },
    [user, pathname],
  );
}
