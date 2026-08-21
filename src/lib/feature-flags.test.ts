import {
  getUserDataStorageMode,
  isStatsDisabled,
  isUserDataLocal,
} from './feature-flags';

describe('feature flags', () => {
  describe('user data storage', () => {
    it.each([undefined, '', 'remote', 'REMOTE', 'invalid'])(
      'defaults %p to remote storage',
      (value) => {
        expect(getUserDataStorageMode(value)).toBe('remote');
        expect(isUserDataLocal(value)).toBe(false);
      },
    );

    it.each(['local', 'LOCAL', ' local '])(
      'recognizes %p as local storage',
      (value) => {
        expect(getUserDataStorageMode(value)).toBe('local');
        expect(isUserDataLocal(value)).toBe(true);
      },
    );
  });

  describe('statistics', () => {
    it.each(['true', 'TRUE', ' true '])(
      'disables statistics for %p',
      (value) => {
        expect(isStatsDisabled(value)).toBe(true);
      },
    );

    it.each([undefined, '', 'false', '1', 'invalid'])(
      'keeps statistics enabled for %p',
      (value) => {
        expect(isStatsDisabled(value)).toBe(false);
      },
    );
  });
});
