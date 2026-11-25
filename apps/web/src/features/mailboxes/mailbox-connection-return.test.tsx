import { MAILBOX_CONNECTION_PATH, type MailboxSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { apiError, fakeApi, lastBodySentTo } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const BACK_FROM_GOOGLE = `${MAILBOX_CONNECTION_PATH}?state=the-state&code=the-code`;
const COMPLETION_PATH = '/api/mailboxes/connection/completion';
const personal: MailboxSummary = {
  id: '5d0c1b7e-3f2a-4c8d-9b6e-1a2b3c4d5e6f',
  provider: 'gmail',
  name: 'Perso',
  address: 'alex.martin@example.com',
  color: 'azur',
  unreadCount: 0,
  status: 'connected',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The api of a server that connects `personal` when asked to finish the connection. */
function connectingApi() {
  let connected = false;
  return fakeApi({
    mailboxes: () => ({ mailboxes: connected ? [personal] : [] }),
    completeMailboxConnection: () => {
      connected = true;
      return personal;
    },
  });
}

function failed(reason: string, providerDetail?: string) {
  return apiError(400, 'MAILBOX_CONNECTION_FAILED', { reason, providerDetail });
}

describe('coming back from Google', () => {
  test('finishes the connection, then shows the mailbox in the settings', async () => {
    const fetchMock = connectingApi();
    const { screen, router } = await renderApp(BACK_FROM_GOOGLE);

    const section = screen.getByRole('region', { name: 'Boîtes mail' });
    await expect.element(section.getByText('alex.martin@example.com')).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
    expect(lastBodySentTo(fetchMock, COMPLETION_PATH)).toEqual({
      state: 'the-state',
      code: 'the-code',
    });
  });

  test('asks the api once, a state working a single time', async () => {
    const fetchMock = fakeApi({ completeMailboxConnection: failed('codeRefused') });
    const { screen, router } = await renderApp(BACK_FROM_GOOGLE);
    await expect.element(screen.getByRole('alert')).toBeVisible();

    window.dispatchEvent(new Event('focus'));
    await router.invalidate();

    await expect.element(screen.getByRole('alert')).toBeVisible();
    expect(fetchMock.mock.calls.filter(([url]) => url === COMPLETION_PATH)).toHaveLength(1);
  });

  test('goes to the settings when the address carries nothing of a provider', async () => {
    fakeApi();
    const { screen, router } = await renderApp(MAILBOX_CONNECTION_PATH);

    await expect.element(screen.getByRole('heading', { name: 'Réglages', level: 1 })).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });
});

describe('a connection that failed', () => {
  test.each([
    ['connectionExpired', /La connexion a expiré ou a déjà servi/],
    ['codeRefused', /Google a refusé de valider la connexion/],
    ['clientRefused', /Google refuse les identifiants de ce serveur/],
    ['accessNotGranted', /Google n’a pas accordé la lecture de tes mails/],
    ['apiDisabled', /L’API Gmail n’est pas activée/],
    ['accountUnreadable', /Google n’a pas voulu indiquer quel compte/],
  ])('says why when the api answers %s', async (reason, message) => {
    fakeApi({ completeMailboxConnection: failed(reason) });
    const { screen } = await renderApp(BACK_FROM_GOOGLE);

    await expect.element(screen.getByText(message)).toBeVisible();
  });

  test('passes on what Google answered, and leads back to the settings', async () => {
    const detail = 'invalid_client: The provided client secret is invalid.';
    fakeApi({ completeMailboxConnection: failed('clientRefused', detail) });
    const { screen, router } = await renderApp(BACK_FROM_GOOGLE);
    await expect.element(screen.getByText(`Détail donné par Google : ${detail}`)).toBeVisible();

    await screen.getByRole('button', { name: 'Retour aux réglages' }).click();

    await expect.element(screen.getByRole('heading', { name: 'Réglages', level: 1 })).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });

  test('says when Google cannot be reached', async () => {
    fakeApi({ completeMailboxConnection: apiError(502, 'MAIL_PROVIDER_UNAVAILABLE') });
    const { screen } = await renderApp(BACK_FROM_GOOGLE);

    await expect.element(screen.getByText(/Google ne répond pas pour le moment/)).toBeVisible();
  });
});

describe('coming back from Google without its agreement', () => {
  test('says the mailbox was not added when the user refused, without asking the api', async () => {
    const fetchMock = fakeApi();
    const { screen } = await renderApp(
      `${MAILBOX_CONNECTION_PATH}?error=access_denied&state=the-state`,
    );

    await expect
      .element(screen.getByText(/Tu n’as pas autorisé MailBox à lire cette boîte/))
      .toBeVisible();
    expect(lastBodySentTo(fetchMock, COMPLETION_PATH)).toBeUndefined();
  });
});
