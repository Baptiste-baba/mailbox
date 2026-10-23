import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import type { ApiConfig } from './config/api-config.js';
import { DatabaseModule } from './database/database.module.js';
import { GlobalExceptionFilter } from './errors/global-exception.filter.js';
import { HealthModule } from './health/health.module.js';
import { createLoggerOptions } from './logging/logger-options.js';

@Module({})
class AppModule {}

export function createAppModule(config: ApiConfig): DynamicModule {
  return {
    module: AppModule,
    imports: [
      LoggerModule.forRoot(createLoggerOptions(config.logLevel)),
      DatabaseModule.register(config.databaseUrl),
      HealthModule,
    ],
    providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
  };
}
