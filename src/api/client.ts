import { useAuth } from '@/store/auth';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const BASE = `${API_URL}/v1`;

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  body?: unknown;
  form?: FormData;
  query?: Query;
  idempotent?: boolean;
  /** Internal: skip the refresh-and-retry path (used by the refresh call itself). */
  noRefresh?: boolean;
}

function buildUrl(path: string, query?: Query) {
  const qs = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}

const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

// Single-flight refresh: concurrent 401s share one rotation request.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken, setTokens, clear } = useAuth.getState();
    if (!refreshToken) return null;
    try {
      const res = await raw<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', {
        body: { refreshToken },
        noRefresh: true,
      });
      await setTokens(res.data.accessToken, res.data.refreshToken);
      return res.data.accessToken;
    } catch {
      await clear(); // refresh failed → signed out
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function raw<T>(method: string, path: string, opts: RequestOptions = {}): Promise<{ data: T; meta: any }> {
  const send = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.idempotent) headers['Idempotency-Key'] = newKey();
    return fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  };

  let res: Response;
  try {
    res = await send(useAuth.getState().accessToken);
    if (res.status === 401 && !opts.noRefresh && useAuth.getState().refreshToken) {
      const fresh = await refreshAccessToken();
      if (fresh) res = await send(fresh);
    }
  } catch (e) {
    throw new ApiError('Unable to reach Tazonix. Check your connection.', 'NETWORK_ERROR', 0);
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(err?.message ?? `Request failed (${res.status})`, err?.code ?? 'HTTP_ERROR', res.status, err?.details);
  }
  return { data: json?.data as T, meta: json?.meta ?? {} };
}

export const api = {
  get: async <T>(path: string, query?: Query) => (await raw<T>('GET', path, { query })).data,
  list: async <T>(path: string, query?: Query) => {
    const res = await raw<T[]>('GET', path, { query });
    return { items: res.data ?? [], page: (res.meta?.page ?? { nextCursor: null, hasMore: false }) as PageMeta };
  },
  post: async <T = unknown>(path: string, body?: unknown, opts?: { idempotent?: boolean }) =>
    (await raw<T>('POST', path, { body: body ?? {}, idempotent: opts?.idempotent })).data,
  put: async <T = unknown>(path: string, body?: unknown) => (await raw<T>('PUT', path, { body: body ?? {} })).data,
  patch: async <T = unknown>(path: string, body?: unknown) => (await raw<T>('PATCH', path, { body: body ?? {} })).data,
  del: async <T = unknown>(path: string) => (await raw<T>('DELETE', path)).data,
  upload: async <T>(path: string, form: FormData) => (await raw<T>('POST', path, { form })).data,
};

/** Resolve relative media/avatar URLs returned by the API. */
export function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
