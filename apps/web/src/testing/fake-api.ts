import type { MailboxList, Thread, ThreadPage, ThreadSummary } from '@mailbox/shared';
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

interface FakeApi {
  threadPages: (url: URL) => ThreadPage | Response;
  thread?: (threadId: string) => Thread | Response;
}

const notFound = () =>
  Response.json({ code: 'THREAD_NOT_FOUND', message: 'Thread not found' }, { status: 404 });

/** Answers the app's requests to the api as the given functions say, and records them. */
export function fakeApi({ threadPages, thread = notFound }: FakeApi) {
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, window.location.origin);
    const answer = (body: object) => (body instanceof Response ? body : Response.json(body));
    if (url.pathname === '/api/threads') {
      return answer(threadPages(url));
    }
    if (url.pathname.startsWith('/api/threads/')) {
      return answer(thread(decodeURIComponent(url.pathname.slice('/api/threads/'.length))));
    }
    if (url.pathname === '/api/mailboxes') {
      return Response.json(testMailboxes);
    }
    return Response.json({ folders: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
