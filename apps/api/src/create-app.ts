import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { createAppModule } from './app.module.js';
import type { ApiConfig } from './config/api-config.js';

export async function createApp(config: ApiConfig): Promise<INestApplication> {
  const app = await NestFactory.create(createAppModule(config), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // /health stays at the root: Docker and monitoring probe it without knowing the API layout.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableShutdownHooks();
  return app;
}
