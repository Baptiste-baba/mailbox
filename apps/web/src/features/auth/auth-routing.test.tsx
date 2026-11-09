import type { AuthStatus } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, serverError, testThread, unauthenticated } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const signedOut = (): AuthStatus => ({ state: 'signedOut' });
const setupRequired = (): AuthStatus => ({ state: 'setupRequired' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('where the app sends whoever opens it', () => {
  test('sends a signed-out user to sign-in, keeping the page to come back to', async () => {
    fakeApi({ authStatus: signedOut });

    const { screen, router } = await renderApp('/inbox?unread=true');

    await expect.element(screen.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toEqual({ redirect: '/inbox?unread=true' });
  });

  test.each(['/inbox', '/login'])(
    'sends to setup from %s while no account exists',
    async (path) => {
      fakeApi({ authStatus: setupRequired });

      const { screen, router } = await renderApp(path);

      await expect.element(screen.getByRole('heading', { name: 'Installation' })).toBeVisible();
      expect(router.state.location.pathname).toBe('/setup');
    },
  );

  test('sends a signed-in user from setup or sign-in to the app', async () => {
    fakeApi();

    const { screen, router } = await renderApp('/setup');
    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();

    await router.navigate({ to: '/login', search: { redirect: '/all' } });
    await expect.element(screen.getByRole('heading', { name: 'Toutes les boîtes' })).toBeVisible();
  });

  test('never sends a signed-in user to another site', async () => {
    fakeApi();

    const { screen, router } = await renderApp('/login?redirect=%2F%2Fexample.com');

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    expect(router.state.location.href).toBe('/inbox');
  });
});

describe('when the session ends or the server is out of reach', () => {
  test('asks to sign in again once the api refuses the session, then comes back', async () => {
    let sessionEnded = false;
    fakeApi({
      authStatus: () =>
        sessionEnded ? { state: 'signedOut' } : { state: 'signedIn', username: 'alex' },
      threadPages: () => {
        sessionEnded = true;
        return unauthenticated();
      },
    });

    const { screen, router } = await renderApp('/all');

    await expect.element(screen.getByText('Ta session a expiré. Reconnecte-toi.')).toBeVisible();
    expect(router.state.location.search).toEqual({ redirect: '/all', reason: 'expired' });
  });
});

describe('when the access was reset on the server', () => {
  // Regression: after a reset on the server, an open tab stayed on sign-in, which always failed.
  test('sends to setup once the access was reset on the server', async () => {
    let reset = false;
    fakeApi({
      authStatus: () =>
        reset ? { state: 'setupRequired' } : { state: 'signedIn', username: 'alex' },
      threadPages: () => {
        reset = true;
        return unauthenticated();
      },
    });

    const { screen, router } = await renderApp('/inbox');

    await expect.element(screen.getByRole('heading', { name: 'Installation' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/setup');
  });
});

describe('when the server is out of reach', () => {
  test('says the server is out of reach, and tries again on request', async () => {
    let reachable = false;
    fakeApi({
      authStatus: () => (reachable ? { state: 'signedIn', username: 'alex' } : serverError()),
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
    });
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Impossible de joindre le serveur')).toBeVisible();

    reachable = true;
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();
  });
});
