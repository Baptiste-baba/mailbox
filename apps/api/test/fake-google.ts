import { vi } from 'vitest';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const PROFILE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
const REVOCATION_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const READ_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/** Google as the api reaches it, answered by the test: no request leaves the machine. */
export class FakeGoogle {
  /** The address of the account the user signs in with. */
  account = 'alex.martin@example.com';
  refusesCodes = false;
  failsToEndAccesses = false;
  /** The forms the api redeemed codes with, oldest first. */
  readonly redemptions: URLSearchParams[] = [];
  /** The refresh tokens granted, oldest first. */
  readonly grantedTokens: string[] = [];
  /** The tokens whose access the api asked to end, oldest first. */
  readonly revokedTokens: string[] = [];

  /** What Google answers to a request, or nothing when the request is not for Google. */
  answer(url: string, init: RequestInit | undefined): Response | undefined {
    const form = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams();
    switch (url) {
      case TOKEN_ENDPOINT:
        return this.redeem(form);
      case PROFILE_ENDPOINT:
        return Response.json({ emailAddress: this.account, messagesTotal: 12 });
      case REVOCATION_ENDPOINT:
        return this.revoke(form.get('token') ?? '');
      default:
        if (new URL(url).hostname.endsWith('.googleapis.com')) {
          throw new Error(`The fake Google has no answer for ${url}`);
        }
        return undefined;
    }
  }

  private redeem(form: URLSearchParams): Response {
    this.redemptions.push(form);
    if (this.refusesCodes) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 });
    }
    const refreshToken = `refresh-token-${this.grantedTokens.length + 1}`;
    this.grantedTokens.push(refreshToken);
    return Response.json({
      access_token: 'access-token',
      refresh_token: refreshToken,
      scope: READ_SCOPE,
      token_type: 'Bearer',
      expires_in: 3599,
    });
  }

  private revoke(token: string): Response {
    if (this.failsToEndAccesses) {
      return new Response(null, { status: 403 });
    }
    this.revokedTokens.push(token);
    return new Response(null, { status: 200 });
  }
}

/**
 * Stands in for Google until `vi.unstubAllGlobals()`. Every other request, such as those of the
 * test to the api, goes out as usual.
 */
export function installFakeGoogle(): FakeGoogle {
  const google = new FakeGoogle();
  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    return Promise.resolve(google.answer(url, init) ?? realFetch(input, init));
  });
  return google;
}
