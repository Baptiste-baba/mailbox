import { type Database, pingDatabase } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { Controller, Get, Inject } from '@nestjs/common';
import { DATABASE } from '../database/database.module.js';

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
