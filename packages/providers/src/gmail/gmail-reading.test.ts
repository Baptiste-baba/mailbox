import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const fetchMock = vi.fn<typeof fetch>();

/** What Gmail answered for a real message, scrambled since. */
function messageAnswer(name: string): Response {
  const answer = readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
  return new Response(answer, { headers: { 'content-type': 'application/json' } });
}

function refused(status: number, name: string): Response {
  return Response.json(
    { error: { code: status, message: 'A sentence.', status: name } },
    { status },
  );
}

/** What Gmail answers, as measured, to requests that come too fast. */
function tooFast(): Response {
  return Response.json(
    {
      error: {
        code: 403,
        message: 'A sentence.',
        errors: [{ reason: 'rateLimitExceeded' }],
        status: 'PERMISSION_DENIED',
        details: [
          { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'RATE_LIMIT_EXCEEDED' },
        ],
      },
    },
    { status: 403 },
  );
}

function requestSent() {
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  return { url: String(url), authorization: new Headers(init?.headers).get('authorization') };
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('listing the messages of a Gmail mailbox', () => {
  it('gives the ids of a page and what asks for the next one', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        messages: [
          { id: 'message-2', threadId: 'thread-1' },
          { id: 'message-1', threadId: 'thread-1' },
        ],
        nextPageToken: 'the-next-page',
        resultSizeEstimate: 2,
      }),
    );

    const page = await provider.listMessages('the-access-token', null);

    expect(page).toEqual({
      providerMessageIds: ['message-2', 'message-1'],
      nextPageToken: 'the-next-page',
    });
    expect(requestSent()).toEqual({
      url: `${API}/messages?maxResults=100&q=-in%3Adraft`,
      authorization: 'Bearer the-access-token',
    });
  });

  it('asks for the page a token stands for, and tells when it was the last', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ messages: [{ id: 'message-0' }] }));

    const page = await provider.listMessages('the-access-token', 'the-next-page');

    expect(page).toEqual({ providerMessageIds: ['message-0'], nextPageToken: null });
    expect(requestSent().url).toBe(
      `${API}/messages?maxResults=100&q=-in%3Adraft&pageToken=the-next-page`,
    );
  });

  it('gives nothing for a page Gmail no longer knows', async () => {
    fetchMock.mockResolvedValueOnce(refused(400, 'INVALID_ARGUMENT'));

    await expect(provider.listMessages('the-access-token', 'a-lost-page')).resolves.toBeNull();
  });

  it('gives no message for an empty mailbox', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ resultSizeEstimate: 0 }));

    await expect(provider.listMessages('the-access-token', null)).resolves.toEqual({
      providerMessageIds: [],
      nextPageToken: null,
    });
  });
});

describe('reading a message of a Gmail mailbox', () => {
  it('asks Gmail for the whole message, and gives it as a mail', async () => {
    fetchMock.mockResolvedValueOnce(messageAnswer('pdf-attachment'));

    const message = await provider.readMessage('the-access-token', '19a000000000aaaa');

    expect(message).toMatchObject({
      providerMessageId: '19a000000000aaaa',
      to: [{ name: '', address: 'contact-3@example.com' }],
      attachments: [{ mimeType: 'application/pdf' }],
    });
    expect(requestSent()).toEqual({
      url: `${API}/messages/19a000000000aaaa?format=full`,
      authorization: 'Bearer the-access-token',
    });
  });

  it('gives nothing for a message deleted since it was listed', async () => {
    fetchMock.mockResolvedValueOnce(refused(404, 'NOT_FOUND'));

    await expect(provider.readMessage('the-access-token', 'gone')).resolves.toBeNull();
  });

  it('reports Gmail as unavailable when its answer is not a message', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'message-1' }));

    await expect(provider.readMessage('the-access-token', 'message-1')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });
});

describe('listing the folders of a Gmail mailbox', () => {
  it('gives the labels the user created, and none of Gmail', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        labels: [
          { id: 'INBOX', name: 'INBOX', type: 'system' },
          { id: 'Label_7', name: 'Factures', type: 'user', messageListVisibility: 'show' },
          { id: 'Label_12', name: 'Factures/2026', type: 'user' },
          { id: 'CATEGORY_UPDATES', name: 'CATEGORY_UPDATES', type: 'system' },
        ],
      }),
    );

    const folders = await provider.listFolders('the-access-token');

    expect(folders).toEqual([
      { providerFolderId: 'Label_7', name: 'Factures' },
      { providerFolderId: 'Label_12', name: 'Factures/2026' },
    ]);
    expect(requestSent().url).toBe(`${API}/labels`);
  });
});

describe('a request Gmail refuses', () => {
  it('reports Gmail as unavailable, with its reason and without its sentence', async () => {
    fetchMock.mockResolvedValueOnce(refused(401, 'UNAUTHENTICATED'));

    await expect(provider.listFolders('an-expired-access')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
      message: 'Gmail refused a request (HTTP 401 UNAUTHENTICATED)',
    });
  });

  it('asks again a moment later when Gmail only says it is asked too fast', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(tooFast()).mockResolvedValueOnce(Response.json({ labels: [] }));

    const folders = provider.listFolders('the-access-token');
    await vi.runAllTimersAsync();

    await expect(folders).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not ask again what Gmail refuses for another reason', async () => {
    fetchMock.mockResolvedValueOnce(refused(403, 'PERMISSION_DENIED'));

    await expect(provider.listFolders('the-access-token')).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not take a first page Gmail calls invalid for a lost page', async () => {
    fetchMock.mockResolvedValueOnce(refused(400, 'INVALID_ARGUMENT'));

    await expect(provider.listMessages('the-access-token', null)).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });

  it('does not take a list Gmail says it has not for an empty one', async () => {
    fetchMock.mockResolvedValueOnce(refused(404, 'NOT_FOUND'));

    await expect(provider.listMessages('the-access-token', null)).rejects.toMatchObject({
      code: 'MAIL_PROVIDER_UNAVAILABLE',
    });
  });
});
