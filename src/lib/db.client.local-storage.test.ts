import type { EpisodeSkipConfig, PlayRecord } from './types';
import { QueryClient } from '@tanstack/react-query';

describe('mixed local user data mode', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    (window as any).RUNTIME_CONFIG = {
      STORAGE_TYPE: 'upstash',
      USER_DATA_STORAGE: 'local',
    };
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    delete (window as any).RUNTIME_CONFIG;
  });

  it('keeps personal data in localStorage without calling remote APIs', async () => {
    const client = await import('./db.client');
    const record: PlayRecord = {
      title: 'Test Show',
      source_name: 'source-a',
      cover: '/cover.jpg',
      year: '2026',
      index: 1,
      total_episodes: 12,
      play_time: 0,
      total_time: 1200,
      save_time: 1,
      search_title: 'Test Show',
    };
    const skipConfig: EpisodeSkipConfig = {
      source: 'source-a',
      id: 'show-1',
      title: 'Test Show',
      segments: [{ start: 0, end: 60, type: 'opening' }],
      updated_time: 1,
    };

    await client.savePlayRecord('source-a', 'show-1', record);
    await client.saveFavorite('source-a', 'show-1', {
      title: record.title,
      source_name: record.source_name,
      year: record.year,
      cover: record.cover,
      total_episodes: record.total_episodes,
      save_time: record.save_time,
      search_title: record.search_title,
    });
    await client.addSearchHistory('Test Show');
    await client.saveReminder('source-a', 'show-1', {
      title: record.title,
      source_name: record.source_name,
      year: record.year,
      cover: record.cover,
      total_episodes: record.total_episodes,
      save_time: record.save_time,
      search_title: record.search_title,
      releaseDate: '2026-08-22',
    });
    await client.saveSkipConfig('source-a', 'show-1', skipConfig);

    expect(await client.getAllPlayRecords()).toEqual({
      'source-a+show-1': expect.objectContaining({ title: 'Test Show' }),
    });
    expect(await client.getAllFavorites()).toEqual({
      'source-a+show-1': expect.objectContaining({ title: 'Test Show' }),
    });
    expect(await client.getSearchHistory()).toEqual(['Test Show']);
    expect(await client.getAllReminders()).toEqual({
      'source-a+show-1': expect.objectContaining({ title: 'Test Show' }),
    });
    expect(await client.getSkipConfig('source-a', 'show-1')).toEqual(
      skipConfig,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('serves local personal data through the TanStack Query options', async () => {
    const client = await import('./db.client');
    const olderRecord: PlayRecord = {
      title: 'Older Show',
      source_name: 'source-a',
      cover: '/older.jpg',
      year: '2025',
      index: 2,
      total_episodes: 12,
      play_time: 120,
      total_time: 1200,
      save_time: 100,
      search_title: 'Older Show',
    };
    const newerRecord: PlayRecord = {
      ...olderRecord,
      title: 'Newer Show',
      cover: '/newer.jpg',
      save_time: 200,
      search_title: 'Newer Show',
    };

    await client.savePlayRecord('source-a', 'older', olderRecord);
    await client.savePlayRecord('source-a', 'newer', newerRecord);
    await client.saveFavorite('source-a', 'favorite', {
      title: 'Favorite Show',
      source_name: 'source-a',
      year: '2026',
      cover: '/favorite.jpg',
      total_episodes: 8,
      save_time: 300,
      search_title: 'Favorite Show',
    });
    await client.saveReminder('source-a', 'reminder', {
      title: 'Reminder Show',
      source_name: 'source-a',
      year: '2026',
      cover: '/reminder.jpg',
      total_episodes: 10,
      save_time: 400,
      search_title: 'Reminder Show',
      releaseDate: '2026-08-23',
    });

    const { playRecordsQueryOptions } =
      await import('@/hooks/usePlayRecordsQuery');
    const { favoritesQueryOptions } = await import('@/hooks/useFavoritesQuery');
    const { remindersQueryOptions } = await import('@/hooks/useRemindersQuery');
    const { continueWatchingOptions } =
      await import('@/hooks/useContinueWatchingQueries');
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const playRecords = await queryClient.fetchQuery(playRecordsQueryOptions);
    const favorites = await queryClient.fetchQuery(favoritesQueryOptions);
    const reminders = await queryClient.fetchQuery(remindersQueryOptions);
    const continueWatching = await queryClient.fetchQuery(
      continueWatchingOptions(),
    );

    expect(Object.keys(playRecords)).toHaveLength(2);
    expect(favorites['source-a+favorite']).toEqual(
      expect.objectContaining({ title: 'Favorite Show' }),
    );
    expect(reminders['source-a+reminder']).toEqual(
      expect.objectContaining({ title: 'Reminder Show' }),
    );
    expect(continueWatching.map((record) => record.title)).toEqual([
      'Newer Show',
      'Older Show',
    ]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
