import { create } from 'zustand';
import type { Me } from '@/api/types';
import { secureStorage } from '@/lib/secureStorage';

const ACCESS_KEY = 'tazonix.accessToken';
const REFRESH_KEY = 'tazonix.refreshToken';

interface AuthState {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: Me | null;
  hydrate: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: Me | null) => void;
  clear: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([secureStorage.get(ACCESS_KEY), secureStorage.get(REFRESH_KEY)]);
    set({ accessToken, refreshToken, hydrated: true });
  },
  setTokens: async (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    await Promise.all([secureStorage.set(ACCESS_KEY, accessToken), secureStorage.set(REFRESH_KEY, refreshToken)]);
  },
  setUser: (user) => set({ user }),
  clear: async () => {
    set({ accessToken: null, refreshToken: null, user: null });
    await Promise.all([secureStorage.remove(ACCESS_KEY), secureStorage.remove(REFRESH_KEY)]);
  },
}));

export const hasRole = (user: Me | null, role: Me['roles'][number]) => !!user?.roles.includes(role);
export const isSeeker = (user: Me | null) => hasRole(user, 'SEEKER') && !hasRole(user, 'TALENT');
