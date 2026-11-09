import type {
  AuthStatus,
  MailboxList,
  SetupResponse,
  Thread,
  ThreadPage,
  ThreadSummary,
  TotpEnrollment,
} from '@mailbox/shared';
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
  threadPages?: (url: URL) => ThreadPage | Response;
  thread?: (threadId: string) => Thread | Response;
  mailboxes?: () => MailboxList | Response;
  authStatus?: () => AuthStatus | Response;
  /** Answers the setup requests, given the body the app sent. */
  setupEnrollment?: (body: unknown) => TotpEnrollment | Response;
  setup?: (body: unknown) => SetupResponse | Response;
}

/** What the api answers when it fails on its side. */
export const serverError = () =>
  Response.json({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });

/** What the api answers to a request without a valid session. */
export const unauthenticated = () =>
  Response.json({ code: 'UNAUTHENTICATED', message: 'Sign in first' }, { status: 401 });

const notFound = () =>
  Response.json({ code: 'THREAD_NOT_FOUND', message: 'Thread not found' }, { status: 404 });

const signedIn = (): AuthStatus => ({ state: 'signedIn', username: 'alex' });
const noThread = (): ThreadPage => ({ threads: [], nextCursor: null });

/** Answers the app's requests to the api as the given functions say, and records them. */
export function fakeApi({
  threadPages = noThread,
  thread = notFound,
  mailboxes = () => testMailboxes,
  authStatus = signedIn,
  setupEnrollment = serverError,
  setup = serverError,
}: FakeApi = {}) {
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, window.location.origin);
    const answer = (body: object) => (body instanceof Response ? body : Response.json(body));
    const sent: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    if (url.pathname === '/api/auth/setup/totp-secret') {
      return answer(setupEnrollment(sent));
    }
    if (url.pathname === '/api/auth/setup') {
      return answer(setup(sent));
    }
    if (url.pathname === '/api/threads') {
      return answer(threadPages(url));
    }
    if (url.pathname.startsWith('/api/threads/')) {
      return answer(thread(decodeURIComponent(url.pathname.slice('/api/threads/'.length))));
    }
    if (url.pathname === '/api/mailboxes') {
      return answer(mailboxes());
    }
    if (url.pathname === '/api/auth/status') {
      return answer(authStatus());
    }
    return Response.json({ folders: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
