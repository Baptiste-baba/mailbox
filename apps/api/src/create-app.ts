import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { createAppModule } from './app.module.ts';
import type { ApiConfig } from './config/api-config.ts';
import { setSecurityHeaders } from './web/security-headers.ts';
import { serveWebApp } from './web/serve-web-app.ts';

export async function createApp(config: ApiConfig): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(createAppModule(config), {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  app.use(setSecurityHeaders);
  if (config.webDirectory !== undefined) {
    serveWebApp(app, config.webDirectory);
  }
  // /health stays at the root: Docker and monitoring probe it without knowing the API layout.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableShutdownHooks();
  return app;
}
