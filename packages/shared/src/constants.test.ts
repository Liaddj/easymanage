import { describe, expect, it } from 'vitest';
import { APP_NAME, DEFAULT_TIMEZONE, USER_ROLES } from './constants';

describe('shared constants', () => {
  it('names the product Flow', () => {
    expect(APP_NAME).toBe('Flow');
  });

  it('locks v1 timezone to Asia/Jerusalem', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Jerusalem');
  });

  it('supports dual roles without a payment role', () => {
    expect(USER_ROLES).toEqual(['provider', 'client']);
  });
});
