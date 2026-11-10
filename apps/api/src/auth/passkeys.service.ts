import { account, type Database, passkey } from '@mailbox/db';
import {
  AppError,
  type PasskeyCreationOptions,
  type PasskeyList,
  type PasskeyRegistration,
  passkeyCreationOptionsSchema,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  type VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { asc, eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { invalidPasskey } from './invalid-passkey.ts';
import { CHALLENGE_LIFETIME_MS, PasskeyChallenges } from './passkey-challenges.ts';
import { passkeyUserHandle } from './passkey-user-handle.ts';
import { RelyingParty } from './relying-party.ts';

/** ES256 then RS256: what passkeys sign with, by order of preference. */
const SUPPORTED_ALGORITHMS = [-7, -257];

/** The passkeys of the account: listing, adding and removing them. */
@Injectable()
export class PasskeysService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly relyingParty: RelyingParty,
    private readonly challenges: PasskeyChallenges,
  ) {}

  async list(): Promise<PasskeyList> {
    const stored = await this.database
      .select({
        id: passkey.id,
        name: passkey.name,
        createdAt: passkey.createdAt,
        lastUsedAt: passkey.lastUsedAt,
      })
      .from(passkey)
      .orderBy(asc(passkey.createdAt));
    return {
      passkeys: stored.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      })),
    };
  }

  /**
   * @param sessionToken The session adding the passkey: only it may finish the addition.
   * @throws AppError UNAUTHENTICATED while no account exists.
   */
  async creationOptions(sessionToken: string): Promise<PasskeyCreationOptions> {
    const [[owner], existing] = await Promise.all([
      this.database
        .select({ username: account.username, passkeyUserId: account.passkeyUserId })
        .from(account),
      this.database.select({ id: passkey.credentialId }).from(passkey),
    ]);
    // A reset of the access ends every session with the account: this only narrows the type.
    if (owner === undefined) {
      throw new AppError('UNAUTHENTICATED', 'No account');
    }
    const options = await generateRegistrationOptions({
      rpName: this.relyingParty.name,
      rpID: this.relyingParty.id,
      userName: owner.username,
      userDisplayName: owner.username,
      userID: Buffer.from(passkeyUserHandle(owner.passkeyUserId), 'base64url'),
      challenge: Buffer.from(this.challenges.issue('registration', sessionToken), 'base64url'),
      timeout: CHALLENGE_LIFETIME_MS,
      attestationType: 'none',
      // With the same user handle, a password manager would replace one of them without a word.
      excludeCredentials: existing,
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      supportedAlgorithmIDs: SUPPORTED_ALGORITHMS,
    });
    return passkeyCreationOptionsSchema.parse(options);
  }

  /**
   * @throws AppError INVALID_PASSKEY when the passkey, or the challenge it answers, is not
   * accepted, or when the account already has it.
   */
  async add(registration: PasskeyRegistration, sessionToken: string): Promise<void> {
    const verification = await this.checkRegistration(registration, sessionToken);
    if (!verification.verified) {
      throw invalidPasskey();
    }
    const { credential } = verification.registrationInfo;
    const added = await this.database
      .insert(passkey)
      .values({
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        signCount: credential.counter,
        name: registration.name,
      })
      .onConflictDoNothing({ target: passkey.credentialId })
      .returning({ id: passkey.id });
    if (added.length === 0) {
      throw invalidPasskey();
    }
  }

  /** Removing a passkey already gone changes nothing. */
  async remove(passkeyId: string): Promise<void> {
    await this.database.delete(passkey).where(eq(passkey.id, passkeyId));
  }

  private async checkRegistration(
    registration: PasskeyRegistration,
    sessionToken: string,
  ): Promise<VerifiedRegistrationResponse> {
    try {
      return await verifyRegistrationResponse({
        response: registration.response,
        // The challenge is used up at once, whatever comes next: it never works twice.
        expectedChallenge: (challenge) =>
          this.challenges.consume(challenge, 'registration', sessionToken),
        expectedOrigin: this.relyingParty.origin,
        expectedRPID: this.relyingParty.id,
        requireUserVerification: true,
        supportedAlgorithmIDs: SUPPORTED_ALGORITHMS,
      });
    } catch (error) {
      // The library throws on any passkey it refuses: origin, relying party, user verification,
      // challenge, algorithm or malformed data.
      throw invalidPasskey(error);
    }
  }
}
