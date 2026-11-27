import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function urlAsked(): string {
  return String(fetchMock.mock.calls[0]?.[0]);
}

/** A record of the history of Gmail, as measured: the messages it is about, then what happened. */
function record(id: string, ...messageIds: string[]) {
  const messages = messageIds.map((messageId) => ({ id: messageId, threadId: 'thread-1' }));
  return {
    id,
    messages,
    labelsAdded: messages.map((message) => ({ message, labelIds: ['UNREAD'] })),
  };
}

describe('asking Gmail where the history of a mailbox stands', () => {
  it('gives the id of its latest change', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        emailAddress: 'alex.martin@example.com',
        messagesTotal: 12,
        historyId: '8421',
      }),
    );

    await expect(provider.currentCursor('the-access-token')).resolves.toBe('8421');
    expect(urlAsked()).toBe(`${API}/profile`);
  });
});

describe('listing what changed in a Gmail mailbox', () => {
  it('gives each changed message once, and where the history stands now', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        history: [record('8422', 'message-1'), record('8425', 'message-2', 'message-1')],
        historyId: '8430',
      }),
    );

    const changes = await provider.listChanges('the-access-token', '8421');

    expect(changes).toEqual({
      changedMessageIds: ['message-1', 'message-2'],
      goneMessageIds: [],
      nextCursor: '8430',
    });
    expect(urlAsked()).toBe(`${API}/history?startHistoryId=8421&maxResults=100`);
  });

  it('moves to where the history stands when nothing changed', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ historyId: '8430' }));

    await expect(provider.listChanges('the-access-token', '8421')).resolves.toEqual({
      changedMessageIds: [],
      goneMessageIds: [],
      nextCursor: '8430',
    });
  });

  it('stops at the last record read when more follow', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        history: [record('8422', 'message-1'), record('8425', 'message-2')],
        nextPageToken: 'the-next-page',
        historyId: '9000',
      }),
    );

    const changes = await provider.listChanges('the-access-token', '8421');

    expect(changes?.nextCursor).toBe('8425');
  });
});

describe('listing what changed in a Gmail mailbox, when Gmail lost it', () => {
  it('gives nothing when Gmail no longer keeps the history since the cursor', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: { code: 404, status: 'NOT_FOUND' } }, { status: 404 }),
    );

    await expect(provider.listChanges('the-access-token', '12')).resolves.toBeNull();
  });
});

describe('reading a message Gmail holds apart', () => {
  // Read by its id, a message of the bin is given like any other: measured on a real mailbox.
  it.each(['TRASH', 'SPAM', 'DRAFT'])('gives nothing for a message labelled %s', async (label) => {
    const answer = JSON.parse(
      readFileSync(new URL('./fixtures/plain-text.json', import.meta.url), 'utf8'),
    );
    fetchMock.mockResolvedValueOnce(Response.json({ ...answer, labelIds: [label, 'UNREAD'] }));

    await expect(provider.readMessage('the-access-token', answer.id)).resolves.toBeNull();
  });
});
