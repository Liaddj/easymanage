import { describe, expect, it } from 'vitest';
import { getFeatureFlags } from './flags';

describe('feature flags', () => {
  it('keeps Google Calendar sync off by default', () => {
    expect(getFeatureFlags({}).googleCalendarSync).toBe(false);
  });

  it('enables calendar sync only when the flag is true', () => {
    expect(getFeatureFlags({ FEATURE_GOOGLE_CALENDAR_SYNC: 'true' }).googleCalendarSync).toBe(true);
  });
});
