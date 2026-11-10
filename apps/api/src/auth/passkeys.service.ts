import type { PasskeyCreationOptions, PasskeyList, PasskeyRegistration } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { RelyingParty } from './relying-party.ts';

/** The passkeys of the account: listing, adding and removing them. */
@Injectable()
export class PasskeysService {
  constructor(private readonly relyingParty: RelyingParty) {}

  // Answers of the contract while the logic is not written: replaced in the next layers.

  async list(): Promise<PasskeyList> {
    return {
      passkeys: [
        {
          id: '0b9d5c3e-7a41-4f2e-9c1d-3e5f6a7b8c9d',
          name: 'iPhone',
          createdAt: '2026-11-10T09:00:00.000Z',
          lastUsedAt: null,
        },
      ],
    };
  }

  /** @param sessionToken The session adding the passkey: only it may finish the addition. */
  async creationOptions(_sessionToken: string): Promise<PasskeyCreationOptions> {
    return {
      challenge: 'Y2hhbGxlbmdlLW9mLXRoZS1hcGk',
      rp: { id: this.relyingParty.id, name: this.relyingParty.name },
      user: { id: 'dXNlci1oYW5kbGU', name: 'alex', displayName: 'alex' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      timeout: 300_000,
      excludeCredentials: [],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestation: 'none',
    };
  }

  /**
   * @throws AppError INVALID_PASSKEY when the passkey, or the challenge it answers, is not
   * accepted.
   */
  async add(_registration: PasskeyRegistration, _sessionToken: string): Promise<void> {}

  /** Removing a passkey already gone changes nothing. */
  async remove(_passkeyId: string): Promise<void> {}
}
