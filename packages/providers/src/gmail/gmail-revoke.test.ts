import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('ending the access to a Gmail mailbox', () => {
  it('hands Google the token to forget', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await provider.revoke('the-refresh-token');

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://oauth2.googleapis.com/revoke');
    expect(init?.method).toBe('POST');
    expect(init?.body).toEqual(new URLSearchParams([['token', 'the-refresh-token']]));
  });

  it('is done when Google no longer knows the token', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'invalid_token' }, { status: 400 }));

    await expect(provider.revoke('the-refresh-token')).resolves.toBeUndefined();
  });

  it('reports Google as unavailable when the access is not ended', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(provider.revoke('the-refresh-token')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });
});
