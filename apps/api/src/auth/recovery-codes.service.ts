import { type Database, recoveryCode, type Transaction } from '@mailbox/db';
import { RECOVERY_CODE_COUNT } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { generateGroupedCode } from './grouped-code.ts';
import { hashToken } from './token-hash.ts';

/** Single-use codes that let the user in without the authenticator app. */
@Injectable()
export class RecoveryCodesService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** Replaces every code with new ones, returned in clear this once: only their hashes are kept. */
  async regenerate(transaction: Transaction): Promise<string[]> {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, generateGroupedCode);
    await transaction.delete(recoveryCode);
    await transaction
      .insert(recoveryCode)
      .values(codes.map((code) => ({ codeHash: hashToken(code) })));
    return codes;
  }

  /** Spends a code; false when it does not exist or was already used. */
  async consume(code: string): Promise<boolean> {
    // One statement: two requests racing with the same code cannot both spend it.
    const spent = await this.database
      .update(recoveryCode)
      .set({ usedAt: new Date() })
      .where(and(eq(recoveryCode.codeHash, hashToken(code)), isNull(recoveryCode.usedAt)))
      .returning({ id: recoveryCode.id });
    return spent.length > 0;
  }

  async countLeft(): Promise<number> {
    const [left] = await this.database
      .select({ count: count() })
      .from(recoveryCode)
      .where(isNull(recoveryCode.usedAt));
    return left?.count ?? 0;
  }
}
