import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const fetchMock = vi.fn<typeof fetch>();
const NOW = new Date('2026-11-26T10:00:00.000Z');

function refused(error: string, status = 400): Response {
  return Response.json({ error, error_description: 'A sentence of Google.' }, { status });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('renewing the access to a Gmail mailbox', () => {
  it('gives the new access, and when Google stops accepting it', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ access_token: 'the-access-token', expires_in: 3599, token_type: 'Bearer' }),
    );

    const access = await provider.renewAccess('the-refresh-token');

    expect(access).toEqual({
      accessToken: 'the-access-token',
      expiresAt: new Date('2026-11-26T10:59:59.000Z'),
    });
  });

  it('hands Google the token kept for the mailbox, as this installation', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'a', expires_in: 3599 }));

    await provider.renewAccess('the-refresh-token');

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init?.method).toBe('POST');
    expect(init?.body).toEqual(
      new URLSearchParams([
        ['grant_type', 'refresh_token'],
        ['refresh_token', 'the-refresh-token'],
        ['client_id', 'client-id'],
        ['client_secret', 'client-secret'],
      ]),
    );
  });
});

describe('an access to a Gmail mailbox that Google does not renew', () => {
  it('asks to reconnect the mailbox when Google no longer accepts its token', async () => {
    fetchMock.mockResolvedValueOnce(refused('invalid_grant'));

    await expect(provider.renewAccess('the-refresh-token')).rejects.toMatchObject({
      code: 'MAILBOX_RECONNECTION_REQUIRED',
    });
  });

  it('does not blame the mailbox when Google refuses this installation', async () => {
    fetchMock.mockResolvedValueOnce(refused('invalid_client', 401));

    await expect(provider.renewAccess('the-refresh-token')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
      message: 'Google refused to renew the access (invalid_client)',
    });
  });

  it('reports Google as unavailable when its answer is not the one it documents', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ expires_in: 3599 }));

    await expect(provider.renewAccess('the-refresh-token')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });
});
