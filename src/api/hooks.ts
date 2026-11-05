import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Genre, Plan } from './types';

export const useGenres = () =>
  useQuery({ queryKey: ['genres'], queryFn: () => api.get<Genre[]>('/genres'), staleTime: 10 * 60_000 });

export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/plans'), staleTime: 10 * 60_000 });
