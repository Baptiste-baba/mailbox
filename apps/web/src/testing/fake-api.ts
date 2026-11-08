import type { MailboxList, ThreadPage, ThreadSummary } from '@mailbox/shared';
import { vi } from 'vitest';

export const testMailboxes: MailboxList = {
  mailboxes: [
    {
      id: 'mailbox-personal',
      name: 'Perso',
      address: 'alex@example.com',
      color: 'azur',
      unreadCount: 1,
      status: 'connected',
    },
  ],
};

export function testThread(id: string, unread: boolean): ThreadSummary {
  return {
    id,
    mailboxId: 'mailbox-personal',
    subject: `Sujet ${id}`,
    sender: { name: `Expéditeur ${id}`, address: `${id}@example.com` },
    snippet: 'Bonjour,',
    lastMessageAt: '2026-11-08T08:00:00.000Z',
    unread,
    messageCount: 1,
    hasAttachments: false,
  };
}

/** Answers the app's requests to the api as the given functions say, and records them. */
export function fakeApi(threads: (url: URL) => ThreadPage | Response) {
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, window.location.origin);
    if (url.pathname === '/api/threads') {
      const page = threads(url);
      return page instanceof Response ? page : Response.json(page);
    }
    if (url.pathname === '/api/mailboxes') {
      return Response.json(testMailboxes);
    }
    return Response.json({ folders: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
