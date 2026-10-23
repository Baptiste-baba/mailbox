import { createDatabase, type Database } from '@mailbox/db';
import {
  type DynamicModule,
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export const DATABASE = Symbol('DATABASE');

@Global()
@Module({})
export class DatabaseModule implements OnApplicationShutdown {
  static register(databaseUrl: string): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE,
          inject: [PinoLogger],
          useFactory: (logger: PinoLogger) =>
            createDatabase(databaseUrl, (error) =>
              logger.error({ err: error }, 'Idle database client failed'),
            ),
        },
      ],
      exports: [DATABASE],
    };
  }

  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onApplicationShutdown(): Promise<void> {
    await this.database.$client.end();
  }
}
