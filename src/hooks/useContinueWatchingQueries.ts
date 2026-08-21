/* eslint-disable no-console */

import { useQuery, queryOptions } from '@tanstack/react-query';
import { getAllPlayRecords } from '@/lib/db.client';
import { useWatchingUpdatesQuery as useWatchingUpdates } from './useWatchingUpdates';

/**
 * Query options for continue watching records
 */
export const continueWatchingOptions = () => queryOptions({
  queryKey: ['playRecords', 'continueWatching'],
  queryFn: async () => {
    const allRecords = await getAllPlayRecords();
    const recordsArray = Object.entries(allRecords).map(([key, record]) => ({
      ...record,
      key,
    }));
    // Sort by save_time descending (newest first)
    return recordsArray.sort((a, b) => b.save_time - a.save_time);
  },
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000,
});

/**
 * Fetch all play records sorted by save_time
 * Based on TanStack Query useQuery with event-driven invalidation
 */
export function useContinueWatchingQuery() {
  return useQuery(continueWatchingOptions());
}

/**
 * Fetch watching updates (new episodes detection)
 * Uses the new TanStack Query implementation
 */
export function useWatchingUpdatesQuery(options?: { enabled?: boolean }) {
  return useWatchingUpdates(options);
}
