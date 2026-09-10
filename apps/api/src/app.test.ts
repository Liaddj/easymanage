import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('API smoke', () => {
  const appPromise = buildApp();

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it('GET /health returns ok with Asia/Jerusalem', async () => {
    const app = await appPromise;
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      ok: boolean;
      service: string;
      timezone: string;
      flags: { googleCalendarSync: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.service).toBe('flow-api');
    expect(body.timezone).toBe('Asia/Jerusalem');
    expect(body.flags.googleCalendarSync).toBe(false);
  });

  it('does not expose a payment surface', async () => {
    const app = await appPromise;
    for (const url of ['/payment', '/payments', '/invoice', '/invoices']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(404);
    }
  });
});
