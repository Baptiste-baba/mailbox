import { Injectable } from '@nestjs/common';

/** Single-use codes that let the user in without the authenticator app. */
@Injectable()
export class RecoveryCodesService {
  /** Replaces every code with new ones, returned in clear this once. */
  regenerate(): Promise<string[]> {
    throw new Error('Not implemented yet');
  }

  /** Spends a code; false when it does not exist or was already used. */
  consume(_code: string): Promise<boolean> {
    throw new Error('Not implemented yet');
  }

  countLeft(): Promise<number> {
    throw new Error('Not implemented yet');
  }
}
