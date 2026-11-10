import { account, type Database, passkey } from '@mailbox/db';
import {
  type PasskeyAuthenticationResponse,
  type PasskeyRequestOptions,
  passkeyRequestOptionsSchema,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  type VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { invalidPasskey } from './invalid-passkey.ts';
import {
  CHALLENGE_LIFETIME_MS,
  type ChallengePurpose,
  PasskeyChallenges,
} from './passkey-challenges.ts';
import { passkeyUserHandle } from './passkey-user-handle.ts';
import { RelyingParty } from './relying-party.ts';

/** Signing in, or confirming the identity, with a passkey of the account. */
type AssertionPurpose = Extract<ChallengePurpose, 'signIn' | 'identityConfirmation'>;

type StoredPasskey = typeof passkey.$inferSelect;

/** Asks a passkey to sign a challenge of the api, then checks its signature and records its use. */
@Injectable()
export class PasskeyAssertionService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly relyingParty: RelyingParty,
    private readonly challenges: PasskeyChallenges,
  ) {}

  /** @param sessionToken The session confirming its identity; none to sign in. */
  async options(purpose: AssertionPurpose, sessionToken?: string): Promise<PasskeyRequestOptions> {
    const options = await generateAuthenticationOptions({
      rpID: this.relyingParty.id,
      challenge: Buffer.from(this.challenges.issue(purpose, sessionToken), 'base64url'),
      timeout: CHALLENGE_LIFETIME_MS,
      userVerification: 'required',
    });
    return passkeyRequestOptionsSchema.parse(options);
  }

  /**
   * @throws AppError INVALID_PASSKEY for any passkey, signature or challenge the api does not
   * accept, without telling which.
   */
  async verify(
    response: PasskeyAuthenticationResponse,
    purpose: AssertionPurpose,
    sessionToken?: string,
  ): Promise<void> {
    const stored = await this.findPasskey(response);
    if (stored === undefined) {
      throw invalidPasskey();
    }
    const verification = await this.checkSignature(response, stored, purpose, sessionToken);
    if (!verification.verified) {
      throw invalidPasskey();
    }
    const { newCounter } = verification.authenticationInfo;
    await this.database
      .update(passkey)
      // Never lower the counter: two uses checked at the same time may write in any order.
      .set({
        signCount: sql`greatest(${passkey.signCount}, ${newCounter})`,
        lastUsedAt: new Date(),
      })
      .where(eq(passkey.id, stored.id));
  }

  /** The passkey the response names, when it belongs to the account it claims to. */
  private async findPasskey(
    response: PasskeyAuthenticationResponse,
  ): Promise<StoredPasskey | undefined> {
    const [[found], [owner]] = await Promise.all([
      this.database.select().from(passkey).where(eq(passkey.credentialId, response.id)),
      this.database.select({ passkeyUserId: account.passkeyUserId }).from(account),
    ]);
    const ownedByAccount =
      owner !== undefined &&
      response.response.userHandle === passkeyUserHandle(owner.passkeyUserId);
    return ownedByAccount ? found : undefined;
  }

  private async checkSignature(
    response: PasskeyAuthenticationResponse,
    stored: StoredPasskey,
    purpose: AssertionPurpose,
    sessionToken: string | undefined,
  ): Promise<VerifiedAuthenticationResponse> {
    try {
      return await verifyAuthenticationResponse({
        response,
        // The challenge is used up at once, whatever comes next: it never works twice.
        expectedChallenge: (challenge) => this.challenges.consume(challenge, purpose, sessionToken),
        expectedOrigin: this.relyingParty.origin,
        expectedRPID: this.relyingParty.id,
        credential: {
          id: stored.credentialId,
          publicKey: Buffer.from(stored.publicKey, 'base64url'),
          counter: stored.signCount,
        },
        requireUserVerification: true,
      });
    } catch (error) {
      // The library throws on any response it refuses: origin, relying party, user verification,
      // challenge, counter going backwards or malformed data.
      throw invalidPasskey(error);
    }
  }
}
