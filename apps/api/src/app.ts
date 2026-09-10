import Fastify from 'fastify';
import { registerHealthRoutes } from './routes/health';

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await registerHealthRoutes(app);

  // Domain modules (auth, availability, booking, reminders, calendar, clients)
  // are scaffolded as empty packages. Do not add payment routes.

  return app;
}
