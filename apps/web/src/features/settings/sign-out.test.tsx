import type { AuthStatus } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, noContent, serverError } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

const LOGOUT = '/api/auth/logout';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The api of a signed-in user, whom `answer` signs out, as the server's status then says. */
function signOutApi(answer: () => Response = noContent) {
  let status: AuthStatus = { state: 'signedIn', username: 'alex' };
  return fakeApi({
    authStatus: () => status,
    logout: () => {
      const response = answer();
      if (response.ok) {
        status = { state: 'signedOut' };
      }
      return response;
    },
  });
}

async function askToSignOut(screen: AppScreen) {
  await screen.getByRole('button', { name: 'Se déconnecter' }).click();
  return screen.getByRole('dialog', { name: 'Se déconnecter ?' });
}

describe('signing out from the settings', () => {
  test('signs out once confirmed, then shows the sign-in', async () => {
    signOutApi();
    const { screen, router } = await renderApp('/settings');
    const dialog = await askToSignOut(screen);

    await dialog.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect.poll(() => router.state.location.pathname).toBe('/login');
    await expect.element(screen.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  });

  test('stays signed in when the sign-out is cancelled', async () => {
    const fetchMock = signOutApi();
    const { screen, router } = await renderApp('/settings');
    const dialog = await askToSignOut(screen);

    await dialog.getByRole('button', { name: 'Annuler' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/settings');
    expect(fetchMock.mock.calls.some(([url]) => url === LOGOUT)).toBe(false);
  });

  test('says when the server could not sign out, and stays', async () => {
    signOutApi(serverError);
    const { screen, router } = await renderApp('/settings');
    const dialog = await askToSignOut(screen);

    await dialog.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect.element(dialog.getByRole('alert')).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });
});
