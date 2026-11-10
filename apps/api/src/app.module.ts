import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { createAuthModule } from './auth/auth.module.ts';
import type { ApiConfig } from './config/api-config.ts';
import { DatabaseModule } from './database/database.module.ts';
import { createValidationPipe } from './errors/create-validation-pipe.ts';
import { GlobalExceptionFilter } from './errors/global-exception.filter.ts';
import { FoldersModule } from './folders/folders.module.ts';
import { HealthModule } from './health/health.module.ts';
import { createLoggerOptions } from './logging/logger-options.ts';
import { MailboxesModule } from './mailboxes/mailboxes.module.ts';
import { ThreadsModule } from './threads/threads.module.ts';

@Module({})
class AppModule {}

export function createAppModule(config: ApiConfig): DynamicModule {
  return {
    module: AppModule,
    imports: [
      LoggerModule.forRoot(createLoggerOptions(config.logLevel)),
      DatabaseModule.register(config.databaseUrl),
      HealthModule,
      createAuthModule(config.secretKey, config.appUrl),
      MailboxesModule,
      FoldersModule,
      ThreadsModule,
    ],
    providers: [
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
      { provide: APP_PIPE, useValue: createValidationPipe() },
    ],
  };
}
