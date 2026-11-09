import { type Database, pingDatabase } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth/public.decorator.ts';
import { DATABASE } from '../database/database.module.ts';

// Probed by Docker and monitoring, which have no session.
@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await pingDatabase(this.database);
    } catch (error) {
      throw new AppError('DATABASE_UNAVAILABLE', 'Database is unreachable', { cause: error });
    }
    return { status: 'ok' };
  }
}
