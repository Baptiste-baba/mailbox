import { type AuthStatus, passkeyLoginRequestSchema } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import {
  addVirtualAuthenticator,
  testPasskeyRequestOptions,
  type VirtualAuthenticator,
} from '../../testing/virtual-authenticator.ts';

const PASSKEY_LOGIN = '/api/auth/passkey-login';

let authenticator: VirtualAuthenticator;

beforeEach(async () => {
  authenticator = await addVirtualAuthenticator();
});

afterEach(async () => {
  await authenticator.remove();
  vi.unstubAllGlobals();
});

/**
 * The api of a user who signs in with a passkey, which `answer` judges: once accepted, the status
 * says signed in, as the server's does. The password alone asks for the second factor.
 */
function passkeyApi(answer: () => Response = () => new Response(null, { status: 204 })) {
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

describe('sign-in with a passkey', () => {
  test('signs in with a passkey alone, and goes back to the page asked for', async () => {
    const fetchMock = passkeyApi();
    const { screen, router } = await renderApp('/login?redirect=%2Fall');

    await userEvent.click(passkeyButton(screen));

    await expect.element(screen.getByRole('heading', { name: 'Toutes les boîtes' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/all');
    const sent = fetchMock.mock.calls.find(([url]) => url === PASSKEY_LOGIN)?.[1];
    const { response } = passkeyLoginRequestSchema.parse(JSON.parse(String(sent?.body)));
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

describe('sign-in with a passkey, when something is wrong', () => {
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
