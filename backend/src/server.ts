import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import app from './app';

async function start() {
  await redis.connect();
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[Server] ${signal} received — shutting down`);
    server.close(() => {
      void Promise.all([prisma.$disconnect(), redis.quit()]).then(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

void start();
