import { describe, expect, it } from 'vitest';
import { DEFAULT_TIMEZONE, USER_ROLES } from '@flow/shared';

describe('mobile smoke', () => {
  it('uses Asia/Jerusalem', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Jerusalem');
  });

  it('is dual-sided (provider and client) with no payment role', () => {
    expect(USER_ROLES).toEqual(['provider', 'client']);
  });
});
