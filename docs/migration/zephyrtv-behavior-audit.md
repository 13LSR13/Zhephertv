# ZephyrTV migration behavior audit

This audit records which Zhephertv behaviors are retained from the current
LunaTV baseline and which legacy patches are intentionally not replayed.

## Scope decisions

| Area              | Zhephertv behavior                                                                                                 | Current ZephyrTV baseline                                                                                                                                                                                          | Migration decision                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Search            | Exact-title preference, title/year aggregation, unknown years last, source/year filtering, optional virtualization | `src/app/search/page.tsx` provides exact search, title/year aggregation, unknown-year ordering, source/title/year/resolution filters, streamed and traditional TanStack Query searches, and TanStack virtual grids | Keep the current implementation; do not transplant the old search page                                |
| Favorites         | Immediate UI response, persistent add/delete, and user-menu synchronization                                        | TanStack Query reads and mutations route through `src/lib/db.client.ts`, preserving optimistic updates plus local and remote persistence paths                                                                     | Keep the current hooks and data contract; add mixed local user-data routing underneath them           |
| Continue watching | Newest records first, cross-page refresh, and episode-update protection                                            | `src/hooks/useContinueWatchingQueries.ts`, user-menu queries, and episode-update reads route through `src/lib/db.client.ts`; records remain sorted by `save_time`                                                  | Keep the current query implementation; do not replay the 2025 `db.client.ts` and `UserMenu.tsx` fixes |
| Personal data     | Optionally keep user activity out of Upstash while retaining remote accounts/config                                | `NEXT_PUBLIC_USER_DATA_STORAGE=local` routes playback, favorites, reminders, search history, skip settings, and derived user statistics to browser storage                                                         | Reimplemented against the current client data API                                                     |
| Statistics        | Reduce Redis/Upstash/Kvrocks commands                                                                              | `DISABLE_STATS=true` prevents statistics reads and writes; local personal-data mode also disables server-side statistics                                                                                           | Reimplemented at the current `DbManager` boundary                                                     |
| Music/MV          | Custom music search and MV playback pages                                                                          | No `/music` or `/mv` application routes are present                                                                                                                                                                | Intentionally removed per migration scope                                                             |

## Acceptance checks

- The default visible brand is `ZephyrTV`; existing `moontv_*` and `lunatv_*`
  compatibility keys remain unchanged so browser and SQLite data continue to work.
- Search keeps exact-match priority, aggregation, filtering, year ordering, and
  virtualization without importing Zhephertv search code.
- Favorites, reminders, and continue-watching use the current TanStack Query
  cache and invalidation paths, with every personal-data query routed through
  `src/lib/db.client.ts` so the configured local/remote mode is respected.
- Mixed local user-data mode does not call the personal-data APIs for browser
  reads or writes.
- Server personal-data endpoints return empty/success responses without
  touching the database when mixed local mode is enabled.
- Statistics-disabled mode reports statistics as unsupported and avoids
  storage-level statistics calls.

## Manual critical-flow checklist

1. Start with `NEXT_PUBLIC_STORAGE_TYPE=upstash` and
   `NEXT_PUBLIC_USER_DATA_STORAGE=local`.
2. Sign in, search for a title, add it to favorites, play it briefly, refresh,
   and confirm the favorite and continue-watching card remain in this browser.
3. Open the same account in a clean browser profile and confirm those personal
   records do not appear there.
4. Repeat with `NEXT_PUBLIC_USER_DATA_STORAGE=remote` and confirm the records
   synchronize across profiles.
5. Set `DISABLE_STATS=true` and confirm personal/admin statistics surfaces
   report that statistics are disabled while playback remains functional.
