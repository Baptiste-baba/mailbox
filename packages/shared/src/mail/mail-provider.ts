import * as z from 'zod';

/** The mail services a mailbox can be connected from. */
export const mailProviderNameSchema = z.enum(['gmail']);

export type MailProviderName = z.infer<typeof mailProviderNameSchema>;

/** The providers this server is configured for: a mailbox can be added from these only. */
export const mailProviderListSchema = z.object({
  providers: z.array(mailProviderNameSchema),
});

export type MailProviderList = z.infer<typeof mailProviderListSchema>;

/** What sends the user to the provider, to sign in there and let the app read their mail. */
export interface AuthorizationRequest {
  /** Comes back with the user: tells which connection they were making. */
  state: string;
  /** Proves, when the code is redeemed, that the same app asked for it (PKCE, S256). */
  codeChallenge: string;
  /** Where the provider sends the user back. */
  redirectUri: string;
  /** The address to sign in with, when a mailbox is being reconnected. */
  loginHint?: string;
}

/** What the provider sent the user back with, and what proves the app asked for it. */
export interface AuthorizationCode {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

/** What a provider grants once the user has signed in. */
export interface ProviderGrant {
  /** The address of the account the user signed in with. */
  address: string;
  /** Renews the access for as long as the user does not withdraw it. Never leaves the server. */
  refreshToken: string;
}

/**
 * A mail service, as the rest of the app sees it. Nothing outside the implementations knows the
 * API of Gmail or of any other provider.
 */
export interface MailProvider {
  /** The page of the provider where the user signs in and grants read access to their mail. */
  authorizationUrl(request: AuthorizationRequest): string;

  /**
   * Redeems the code the user came back with.
   * @throws AppError MAILBOX_CONNECTION_FAILED when the provider refuses the code or grants no
   * lasting access.
   * @throws AppError MAIL_PROVIDER_UNAVAILABLE when the provider cannot be reached.
   */
  redeem(code: AuthorizationCode): Promise<ProviderGrant>;

  /**
   * Ends the access a refresh token gives. One the provider no longer knows is already ended.
   * @throws AppError MAIL_PROVIDER_UNAVAILABLE when the provider cannot be reached.
   */
  revoke(refreshToken: string): Promise<void>;
}
