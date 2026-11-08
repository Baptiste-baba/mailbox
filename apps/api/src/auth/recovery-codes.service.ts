import { recoveryCode, type Transaction } from '@mailbox/db';
import { RECOVERY_CODE_COUNT } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { generateGroupedCode } from './grouped-code.ts';
import { hashToken } from './token-hash.ts';

/** Single-use codes that let the user in without the authenticator app. */
@Injectable()
export class RecoveryCodesService {
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
  consume(_code: string): Promise<boolean> {
    throw new Error('Not implemented yet');
  }

  countLeft(): Promise<number> {
    throw new Error('Not implemented yet');
  }
}
