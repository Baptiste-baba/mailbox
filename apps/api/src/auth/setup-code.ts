import { setupCode, type Transaction } from '@mailbox/db';
import { generateGroupedCode } from './grouped-code.ts';
import { hashToken } from './token-hash.ts';

const SETUP_CODE_LIFETIME_MS = 60 * 60 * 1_000;

/**
 * A new one-time setup code, valid for an hour, in place of any earlier one. Returned in clear
 * this once: only its hash is stored.
 */
export async function replaceSetupCode(transaction: Transaction): Promise<string> {
  const code = generateGroupedCode();
  await transaction.delete(setupCode);
  await transaction.insert(setupCode).values({
    codeHash: hashToken(code),
    expiresAt: new Date(Date.now() + SETUP_CODE_LIFETIME_MS),
  });
  return code;
}
