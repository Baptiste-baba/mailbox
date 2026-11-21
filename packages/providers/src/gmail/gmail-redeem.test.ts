import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const PROFILE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
const READ_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const code = {
  code: 'the-code',
  codeVerifier: 'the-verifier',
  redirectUri: 'https://mail.example.test/mailbox-connection',
};
const grant = { access_token: 'the-access-token', refresh_token: 'the-refresh-token' };
const fetchMock = vi.fn<typeof fetch>();

function granted(fields: object = { ...grant, scope: READ_SCOPE }): Response {
  return Response.json({ token_type: 'Bearer', expires_in: 3599, ...fields });
}

function profile(): Response {
  return Response.json({ emailAddress: 'alex.martin@example.com', messagesTotal: 12 });
}

/** What Google answers to the code, then to the question of whose account it is. */
function stubGoogle(tokenAnswer: Response, profileAnswer: Response = profile()): void {
  fetchMock.mockImplementation((url) => {
    return Promise.resolve(String(url) === TOKEN_ENDPOINT ? tokenAnswer : profileAnswer);
  });
}

function formSent(): Record<string, string> {
  const body = fetchMock.mock.calls[0]?.[1]?.body;
  return body instanceof URLSearchParams ? Object.fromEntries(body) : {};
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('redeeming the code Google sent the user back with', () => {
  it('gives the address of the account and the token that renews its access', async () => {
    stubGoogle(granted());

    const result = await provider.redeem(code);

    expect(result).toEqual({
      address: 'alex.martin@example.com',
      refreshToken: 'the-refresh-token',
    });
  });

  it('sends the code with what proves this installation asked for it', async () => {
    stubGoogle(granted());

    await provider.redeem(code);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(TOKEN_ENDPOINT);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(formSent()).toEqual({
      grant_type: 'authorization_code',
      code: 'the-code',
      code_verifier: 'the-verifier',
      redirect_uri: 'https://mail.example.test/mailbox-connection',
      client_id: 'client-id',
      client_secret: 'client-secret',
    });
  });

  it('asks whose account it is with the access just granted', async () => {
    stubGoogle(granted());

    await provider.redeem(code);

    expect(fetchMock.mock.calls[1]?.[0]).toBe(PROFILE_ENDPOINT);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({
      authorization: 'Bearer the-access-token',
    });
  });
});

describe('a Gmail connection Google does not fully grant', () => {
  it('fails when Google refuses the code, and says why', async () => {
    stubGoogle(Response.json({ error: 'invalid_grant' }, { status: 400 }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAILBOX_CONNECTION_FAILED',
      message: 'Google refused the code (invalid_grant)',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('repeats nothing of a refusal that is not a plain reason', async () => {
    stubGoogle(Response.json({ error: 'Token the-code was refused' }, { status: 400 }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      message: 'Google refused the code (HTTP 400)',
    });
  });

  it('fails when Google grants no token to renew the access', async () => {
    stubGoogle(granted({ access_token: 'the-access-token', scope: READ_SCOPE }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAILBOX_CONNECTION_FAILED',
    });
  });

  it('fails when Google grants something else than reading the mail', async () => {
    stubGoogle(granted({ ...grant, scope: 'openid' }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAILBOX_CONNECTION_FAILED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('a Gmail connection Google answers oddly to', () => {
  it('fails when Google refuses to say whose account it is', async () => {
    stubGoogle(granted(), new Response(null, { status: 403 }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAILBOX_CONNECTION_FAILED',
      message: 'Google refused to give the address of the account (HTTP 403)',
    });
  });

  it('reports Google as unavailable when its grant is not the documented one', async () => {
    stubGoogle(Response.json({ scope: READ_SCOPE }));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
      message: 'The mail provider sent an unexpected answer (access_token)',
    });
  });

  it('reports Google as unavailable when its answer is not JSON', async () => {
    stubGoogle(new Response('<html>'));

    await expect(provider.redeem(code)).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });
});
