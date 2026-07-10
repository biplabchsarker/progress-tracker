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

  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received — shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
}

void start();
