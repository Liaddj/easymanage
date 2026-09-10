import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('defaults to Asia/Jerusalem and port 3000', () => {
    const env = loadEnv({});
    expect(env.APP_TIMEZONE).toBe('Asia/Jerusalem');
    expect(env.PORT).toBe(3000);
    expect(env.FEATURE_GOOGLE_CALENDAR_SYNC).toBe('false');
  });

  it('rejects a non-Israel timezone for v1', () => {
    expect(() => loadEnv({ APP_TIMEZONE: 'UTC' })).toThrow(/Invalid environment/);
  });
});
