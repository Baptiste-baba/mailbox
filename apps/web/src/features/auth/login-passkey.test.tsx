import { type AuthStatus, passkeyLoginRequestSchema } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, lastBodySentTo, noContent } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import {
  addVirtualAuthenticator,
  testPasskeyRequestOptions,
  type VirtualAuthenticator,
  waitForeverForPick,
} from '../../testing/virtual-authenticator.ts';

const PASSKEY_LOGIN = '/api/auth/passkey-login';

let authenticator: VirtualAuthenticator;

beforeEach(async () => {
  authenticator = await addVirtualAuthenticator();
});

afterEach(async () => {
  await authenticator.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * The api of a user who signs in with a passkey, which `answer` judges: once accepted, the status
 * says signed in, as the server's does. The password alone asks for the second factor.
 */
function passkeyApi(answer: () => Response = noContent) {
  let status: AuthStatus = { state: 'signedOut' };
  return fakeApi({
    authStatus: () => status,
    login: apiError(401, 'SECOND_FACTOR_REQUIRED'),
    passkeyLoginOptions: testPasskeyRequestOptions,
    passkeyLogin: () => {
      const response = answer();
      if (response.ok) {
        status = { state: 'signedIn', username: 'alex' };
      }
      return response;
    },
  });
}

function passkeyButton(screen: AppScreen) {
  return screen.getByRole('button', { name: 'Se connecter avec une passkey' });
}

/**
 * The user picks no passkey among the suggestions of the username field: else Chromium's virtual
 * authenticator, which picks its passkey at once, signs in before any button is pressed.
 */
function pickNoSuggestion() {
  const ask = navigator.credentials.get.bind(navigator.credentials);
  return vi
    .spyOn(navigator.credentials, 'get')
    .mockImplementation((request) =>
      request?.mediation === 'conditional' ? waitForeverForPick(request) : ask(request),
    );
}

describe('sign-in with a passkey', () => {
  beforeEach(() => {
    pickNoSuggestion();
  });

  test('signs in with a passkey alone, and goes back to the page asked for', async () => {
    const fetchMock = passkeyApi();
    const { screen, router } = await renderApp('/login?redirect=%2Fall');

    await userEvent.click(passkeyButton(screen));

    await expect.element(screen.getByRole('heading', { name: 'Toutes les boîtes' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/all');
    const { response } = passkeyLoginRequestSchema.parse(lastBodySentTo(fetchMock, PASSKEY_LOGIN));
    expect(response.id).toBe(authenticator.passkeyId);
  });

  test('offers the passkey at the second factor too, the password aside', async () => {
    passkeyApi();
    const { screen } = await renderApp('/login');
    await userEvent.fill(screen.getByLabelText('Nom d’utilisateur'), 'alex');
    await userEvent.fill(screen.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));

    await userEvent.click(screen.getByRole('button', { name: 'Utiliser une passkey' }));

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
  });
});

describe('sign-in with a passkey suggested in the username field', () => {
  test('signs in with the passkey picked among the suggestions of the username field', async () => {
    const fetchMock = passkeyApi();
    const { router } = await renderApp('/login?redirect=%2Fall');

    await expect.poll(() => router.state.location.pathname).toBe('/all');
    const { response } = passkeyLoginRequestSchema.parse(lastBodySentTo(fetchMock, PASSKEY_LOGIN));
    expect(response.id).toBe(authenticator.passkeyId);
  });

  test('marks the username field for the suggestions of passkeys', async () => {
    pickNoSuggestion();
    passkeyApi();
    const { screen } = await renderApp('/login');

    await expect
      .element(screen.getByLabelText('Nom d’utilisateur'))
      .toHaveAttribute('autocomplete', 'username webauthn');
  });

  test('stops suggesting when the button takes over', async () => {
    const browser = pickNoSuggestion();
    passkeyApi();
    const { screen } = await renderApp('/login');
    await vi.waitFor(() => expect(browser).toHaveBeenCalledOnce());

    await userEvent.click(passkeyButton(screen));

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    expect(browser.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
  });
});

describe('sign-in with a passkey, when something is wrong', () => {
  beforeEach(() => {
    pickNoSuggestion();
  });

  test('says when the api does not know the passkey', async () => {
    passkeyApi(apiError(401, 'INVALID_PASSKEY'));
    const { screen } = await renderApp('/login');

    await userEvent.click(passkeyButton(screen));

    await expect.element(screen.getByRole('alert').getByText(/n’est pas reconnue/)).toBeVisible();
  });

  test('says nothing when the passkey is not unlocked, and sends nothing', async () => {
    const fetchMock = passkeyApi();
    await authenticator.refuseUnlocking();
    const { screen } = await renderApp('/login');

    await userEvent.click(passkeyButton(screen));

    await expect.element(passkeyButton(screen)).toBeEnabled();
    expect(screen.getByRole('alert').query()).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => url === PASSKEY_LOGIN)).toBe(false);
  });

  test('offers no passkey where the browser cannot use them', async () => {
    passkeyApi();
    vi.stubGlobal('PublicKeyCredential', undefined);
    const { screen } = await renderApp('/login');

    await expect.element(screen.getByRole('button', { name: 'Continuer' })).toBeVisible();
    expect(passkeyButton(screen).query()).toBeNull();
  });
});

describe('sign-in with a passkey, then the password', () => {
  beforeEach(() => {
    pickNoSuggestion();
  });

  // Regression: a refused passkey kept its message over the errors of the password tried next.
  test('shows the error of the password tried after a refused passkey', async () => {
    fakeApi({
      authStatus: () => ({ state: 'signedOut' }),
      login: apiError(401, 'INVALID_CREDENTIALS'),
      passkeyLoginOptions: testPasskeyRequestOptions,
      passkeyLogin: apiError(401, 'INVALID_PASSKEY'),
    });
    const { screen } = await renderApp('/login');
    await userEvent.click(passkeyButton(screen));
    await expect.element(screen.getByRole('alert').getByText(/n’est pas reconnue/)).toBeVisible();

    await userEvent.fill(screen.getByLabelText('Nom d’utilisateur'), 'alex');
    await userEvent.fill(screen.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));

    await expect
      .element(screen.getByRole('alert').getByText(/mot de passe incorrect/))
      .toBeVisible();
  });
});
