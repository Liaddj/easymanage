import './load-dotenv';
import { buildApp } from './app';
import { loadEnv } from './config/env';

const env = loadEnv();
const app = await buildApp();

await app.listen({ port: env.PORT, host: '0.0.0.0' });
