import { type Database, passkey } from '@mailbox/db';
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
import { AccountCredentialsService } from './account-credentials.service.ts';
import { invalidPasskey } from './invalid-passkey.ts';
import {
  CHALLENGE_LIFETIME_MS,
  PasskeyChallenges,
  type SessionChallengeScope,
} from './passkey-challenges.ts';
import { passkeyUserHandle } from './passkey-user-handle.ts';
import { RelyingParty } from './relying-party.ts';

type StoredPasskey = typeof passkey.$inferSelect;

/** The challenge of a session confirming its identity; none to sign in. */
function confirmationScope(sessionToken: string | undefined): SessionChallengeScope | undefined {
  return sessionToken === undefined ? undefined : { purpose: 'identityConfirmation', sessionToken };
}

/**
 * Asks a passkey to sign a challenge of the api, then checks its signature and records its use: to
 * sign in, or, given the session, to confirm its identity.
 */
@Injectable()
export class PasskeyAssertionService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly relyingParty: RelyingParty,
    private readonly challenges: PasskeyChallenges,
    private readonly credentials: AccountCredentialsService,
  ) {}

  /** @param sessionToken The session confirming its identity; none to sign in. */
  async options(sessionToken?: string): Promise<PasskeyRequestOptions> {
    const options = await generateAuthenticationOptions({
      rpID: this.relyingParty.id,
      challenge: Buffer.from(this.challenges.issue(confirmationScope(sessionToken)), 'base64url'),
      timeout: CHALLENGE_LIFETIME_MS,
      userVerification: 'required',
    });
    return passkeyRequestOptionsSchema.parse(options);
  }

  /**
   * @param sessionToken The session confirming its identity; none to sign in.
   * @throws AppError INVALID_PASSKEY for any passkey, signature or challenge the api does not
   * accept, without telling which.
   */
  async verify(response: PasskeyAuthenticationResponse, sessionToken?: string): Promise<void> {
    const stored = await this.findPasskey(response);
    if (stored === undefined) {
      throw invalidPasskey();
    }
    const verification = await this.checkSignature(response, stored, sessionToken);
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
    const [[found], owner] = await Promise.all([
      this.database.select().from(passkey).where(eq(passkey.credentialId, response.id)),
      this.credentials.find(),
    ]);
    const ownedByAccount =
      owner !== undefined &&
      response.response.userHandle === passkeyUserHandle(owner.passkeyUserId);
    return ownedByAccount ? found : undefined;
  }

  private async checkSignature(
    response: PasskeyAuthenticationResponse,
    stored: StoredPasskey,
    sessionToken: string | undefined,
  ): Promise<VerifiedAuthenticationResponse> {
    try {
      return await verifyAuthenticationResponse({
        response,
        // The challenge is used up at once, whatever comes next: it never works twice.
        expectedChallenge: (challenge) =>
          this.challenges.consume(challenge, confirmationScope(sessionToken)),
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
