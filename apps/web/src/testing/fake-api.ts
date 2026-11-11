import type {
  AuthStatus,
  MailboxList,
  PasskeyCreationOptions,
  PasskeyList,
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

/** What a fake route answers: the data of the contract or a response, at once or late. */
type Answer<Data = never> = Data | Response | Promise<Data | Response>;

interface FakeApi {
  threadPages?: (url: URL) => Answer<ThreadPage>;
  thread?: (threadId: string) => Answer<Thread>;
  mailboxes?: () => Answer<MailboxList>;
  authStatus?: () => Answer<AuthStatus>;
  /** Answers the setup requests, given the body the app sent. */
  setupEnrollment?: (body: unknown) => Answer<TotpEnrollment>;
  setup?: (body: unknown) => Answer<SetupResponse>;
  /** Answers the sign-in, given the body the app sent. */
  login?: (body: unknown) => Answer;
  /** Answers the sign-in with a passkey: its options, then the passkey the app sent. */
  passkeyLoginOptions?: () => Answer<PasskeyRequestOptions>;
  passkeyLogin?: (body: unknown) => Answer;
  /** The passkeys of the account, for the security settings. */
  passkeys?: () => Answer<PasskeyList>;
  /** Answers the changes of the passkeys, given what the app sent. */
  passkeyCreationOptions?: () => Answer<PasskeyCreationOptions>;
  addPasskey?: (body: unknown) => Answer;
  removePasskey?: (passkeyId: string) => Answer;
  /** Answers the confirmation of the identity: its options, then the proof the app sent. */
  identityConfirmationOptions?: () => Answer<PasskeyRequestOptions>;
  confirmIdentity?: (body: unknown) => Answer;
  /** Answers the sign-out of this device, and of the other ones. */
  logout?: () => Answer;
  logoutOthers?: () => Answer;
  /** Answers the requests replacing the authenticator app. */
  authenticatorSecret?: () => Answer<TotpEnrollment>;
  authenticatorReplacement?: (body: unknown) => Answer;
}

/** An error of the api contract, as the api answers it. */
export function apiError(status: number, code: string, details?: object) {
  return () => Response.json({ code, message: code, details }, { status });
}

/** What the api answers when it fails on its side. */
export const serverError = apiError(500, 'INTERNAL_ERROR');

/** What the api answers to an action done, with nothing to say. */
export const noContent = () => new Response(null, { status: 204 });

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

interface FakeRequest {
  /** The body the app sent, parsed. */
  sent: unknown;
  url: URL;
  /** What stands for `:id` in the route's path. */
  id: string;
}

type FakeRoute = (request: FakeRequest) => Answer<object>;

/** The route for `METHOD /path`, else for `METHOD /parent/:id`, with what stands for its id. */
function findRoute(routes: Record<string, FakeRoute>, method: string, path: string) {
  const exact = routes[`${method} ${path}`];
  if (exact !== undefined) {
    return { route: exact, id: '' };
  }
  const slash = path.lastIndexOf('/');
  const route = routes[`${method} ${path.slice(0, slash)}/:id`];
  return route === undefined ? undefined : { route, id: decodeURIComponent(path.slice(slash + 1)) };
}

/**
 * Answers the app's requests to the api as the given functions say, and records them. A request
 * no route expects fails, naming it.
 */
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
  passkeys = () => ({ passkeys: [] }),
  passkeyCreationOptions = serverError,
  addPasskey = serverError,
  removePasskey = serverError,
  identityConfirmationOptions = serverError,
  confirmIdentity = serverError,
  logout = serverError,
  logoutOthers = serverError,
  authenticatorSecret = serverError,
  authenticatorReplacement = serverError,
}: FakeApi = {}) {
  const routes: Record<string, FakeRoute> = {
    'GET /api/threads': ({ url }) => threadPages(url),
    'GET /api/threads/:id': ({ id }) => thread(id),
    'GET /api/mailboxes': () => mailboxes(),
    'GET /api/folders': () => ({ folders: [] }),
    'GET /api/auth/status': () => authStatus(),
    'POST /api/auth/setup/totp-secret': ({ sent }) => setupEnrollment(sent),
    'POST /api/auth/setup': ({ sent }) => setup(sent),
    'POST /api/auth/login': ({ sent }) => login(sent),
    'POST /api/auth/passkey-login/options': () => passkeyLoginOptions(),
    'POST /api/auth/passkey-login': ({ sent }) => passkeyLogin(sent),
    'GET /api/auth/passkeys': () => passkeys(),
    'POST /api/auth/passkeys': ({ sent }) => addPasskey(sent),
    'POST /api/auth/passkeys/options': () => passkeyCreationOptions(),
    'DELETE /api/auth/passkeys/:id': ({ id }) => removePasskey(id),
    'POST /api/auth/identity-confirmation/options': () => identityConfirmationOptions(),
    'POST /api/auth/identity-confirmation': ({ sent }) => confirmIdentity(sent),
    'POST /api/auth/logout': () => logout(),
    'POST /api/auth/logout/others': () => logoutOthers(),
    'POST /api/auth/totp/secret': () => authenticatorSecret(),
    'PUT /api/auth/totp': ({ sent }) => authenticatorReplacement(sent),
  };
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, window.location.origin);
    const method = init?.method ?? 'GET';
    const found = findRoute(routes, method, url.pathname);
    if (found === undefined) {
      throw new Error(`The fake api has no route for ${method} ${url.pathname}`);
    }
    const sent: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const body = await found.route({ sent, url, id: found.id });
    return body instanceof Response ? body : Response.json(body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** What the app last sent to `path` in a request with a body, as it was parsed. */
export function lastBodySentTo(fetchMock: ReturnType<typeof fakeApi>, path: string): unknown {
  const sent = fetchMock.mock.calls.findLast(
    ([url, init]) => url === path && init?.body !== undefined,
  )?.[1]?.body;
  return sent === undefined ? undefined : JSON.parse(String(sent));
}
