import type { CompPhase } from '@/api/types';

export function money(amountMinor: number | null | undefined, currency = 'CAD') {
  const value = (amountMinor ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function date(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h left` : `${h}h ${Math.floor((ms % 3_600_000) / 60_000)}m left`;
}

export const phaseLabel: Record<CompPhase, string> = {
  UPCOMING: 'Upcoming',
  SUBMISSIONS_OPEN: 'Submissions open',
  VOTING: 'Voting live',
  CLOSED: 'Closed',
};

export const titleCase = (s: string) => s.toLowerCase().replace(/(^|_)(\w)/g, (_, sep, c) => (sep ? ' ' : '') + c.toUpperCase());

/** Parse "12.50" → 1250 minor units. */
export function toMinor(input: string): number {
  const n = Number(input.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
