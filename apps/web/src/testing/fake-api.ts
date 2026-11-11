import type {
  AuthStatus,
  MailboxList,
  PasskeyRequestOptions,
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
  /** Answers the sign-in, given the body the app sent. */
  login?: (body: unknown) => Response;
  /** Answers the sign-in with a passkey: its options, then the passkey the app sent. */
  passkeyLoginOptions?: () => PasskeyRequestOptions | Response;
  passkeyLogin?: (body: unknown) => Response;
  /** Answers the requests replacing the authenticator app. */
  authenticatorSecret?: () => TotpEnrollment | Response;
  authenticatorReplacement?: (body: unknown) => Response;
}

/** An error of the api contract, as the api answers it. */
export function apiError(status: number, code: string, details?: object) {
  return () => Response.json({ code, message: code, details }, { status });
}

/** What the api answers when it fails on its side. */
export const serverError = apiError(500, 'INTERNAL_ERROR');

/** What the api answers to a request without a valid session. */
export const unauthenticated = apiError(401, 'UNAUTHENTICATED');

const notFound = apiError(404, 'THREAD_NOT_FOUND');

const TEST_TOTP_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

/** A secret for the authenticator app, as the api gives it. */
export const testEnrollment: TotpEnrollment = {
  secret: TEST_TOTP_SECRET,
  otpauthUri: `otpauth://totp/MailBox:alex?secret=${TEST_TOTP_SECRET}&issuer=MailBox`,
};

const signedIn = (): AuthStatus => ({ state: 'signedIn', username: 'alex' });
const noThread = (): ThreadPage => ({ threads: [], nextCursor: null });

type FakeRoute = (sent: unknown, url: URL) => object;

const THREAD_PATH = '/api/threads/';

/** Answers the app's requests to the api as the given functions say, and records them. */
export function fakeApi({
  threadPages = noThread,
  thread = notFound,
  mailboxes = () => testMailboxes,
  authStatus = signedIn,
  setupEnrollment = serverError,
  setup = serverError,
  login = serverError,
  passkeyLoginOptions = serverError,
  passkeyLogin = serverError,
  authenticatorSecret = serverError,
  authenticatorReplacement = serverError,
}: FakeApi = {}) {
  const routes: Record<string, FakeRoute> = {
    '/api/threads': (_sent, url) => threadPages(url),
    '/api/mailboxes': () => mailboxes(),
    '/api/folders': () => ({ folders: [] }),
    '/api/auth/status': () => authStatus(),
    '/api/auth/setup/totp-secret': setupEnrollment,
    '/api/auth/setup': setup,
    '/api/auth/login': login,
    '/api/auth/passkey-login/options': () => passkeyLoginOptions(),
    '/api/auth/passkey-login': passkeyLogin,
    '/api/auth/totp/secret': () => authenticatorSecret(),
    '/api/auth/totp': authenticatorReplacement,
  };
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, window.location.origin);
    const sent: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const route = routes[url.pathname];
    const body =
      route === undefined
        ? thread(decodeURIComponent(url.pathname.slice(THREAD_PATH.length)))
        : route(sent, url);
    return body instanceof Response ? body : Response.json(body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
