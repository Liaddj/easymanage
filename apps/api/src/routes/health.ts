import type { FastifyInstance } from 'fastify';
import { APP_NAME, DEFAULT_TIMEZONE } from '@flow/shared';
import { getFeatureFlags } from '../config/flags';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    const flags = getFeatureFlags();
    return {
      ok: true,
      service: 'flow-api',
      name: APP_NAME,
      timezone: DEFAULT_TIMEZONE,
      flags,
    };
  });
}
