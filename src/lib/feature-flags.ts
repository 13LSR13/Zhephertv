export type UserDataStorageMode = 'local' | 'remote';

export function getUserDataStorageMode(
  value = process.env.NEXT_PUBLIC_USER_DATA_STORAGE,
): UserDataStorageMode {
  return value?.trim().toLowerCase() === 'local' ? 'local' : 'remote';
}

export function isUserDataLocal(value?: string): boolean {
  return getUserDataStorageMode(value) === 'local';
}

export function isStatsDisabled(value = process.env.DISABLE_STATS): boolean {
  return value?.trim().toLowerCase() === 'true';
}
