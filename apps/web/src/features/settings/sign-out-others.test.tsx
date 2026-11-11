import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, noContent, serverError } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import { settingsApi } from '../../testing/settings-api.ts';

const LOGOUT_OTHERS = '/api/auth/logout/others';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function askToSignOutOthers(screen: AppScreen) {
  await screen.getByRole('button', { name: 'Déconnecter les autres appareils' }).click();
  return screen.getByRole('dialog', { name: 'Déconnecter les autres appareils ?' });
}

describe('signing out the other devices from the settings', () => {
  test('signs out the other devices once confirmed, and says so, this one staying', async () => {
    const fetchMock = settingsApi();
    const { screen, router } = await renderApp('/settings');
    const dialog = await askToSignOutOthers(screen);

    await dialog.getByRole('button', { name: 'Déconnecter', exact: true }).click();

    await expect
      .element(screen.getByRole('status').getByText('Tes autres appareils sont déconnectés.'))
      .toBeVisible();
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/settings');
    expect(fetchMock.mock.calls.filter(([url]) => url === LOGOUT_OTHERS)).toHaveLength(1);
  });

  test('confirms the identity first when the api asks, then signs them out', async () => {
    settingsApi({ confirmationExpired: true });
    const { screen } = await renderApp('/settings');
    const dialog = await askToSignOutOthers(screen);
    await dialog.getByRole('button', { name: 'Déconnecter', exact: true }).click();

    await userEvent.fill(dialog.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.fill(dialog.getByLabelText(/Code à 6 chiffres/), '123456');
    await dialog.getByRole('button', { name: 'Confirmer' }).click();

    await expect
      .element(screen.getByRole('status').getByText('Tes autres appareils sont déconnectés.'))
      .toBeVisible();
  });
});

describe('signing out the other devices, when it does not happen', () => {
  test('changes nothing when cancelled', async () => {
    const fetchMock = settingsApi();
    const { screen } = await renderApp('/settings');
    const dialog = await askToSignOutOthers(screen);

    await dialog.getByRole('button', { name: 'Annuler' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === LOGOUT_OTHERS)).toBe(false);
  });

  test('says when the server could not sign them out', async () => {
    fakeApi({ logoutOthers: serverError });
    const { screen } = await renderApp('/settings');
    const dialog = await askToSignOutOthers(screen);

    await dialog.getByRole('button', { name: 'Déconnecter', exact: true }).click();

    await expect.element(dialog.getByRole('alert')).toBeVisible();
    expect(screen.getByText('Tes autres appareils sont déconnectés.').query()).toBeNull();
  });
});

describe('signing out the other devices, the dialog closed meanwhile', () => {
  // Regression: closing the dialog while the request ran lost the confirmation message.
  test('says so once done, the dialog closed or not', async () => {
    let answer: (() => void) | undefined;
    fakeApi({
      logoutOthers: () =>
        new Promise((resolve) => {
          answer = () => resolve(noContent());
        }),
    });
    const { screen } = await renderApp('/settings');
    const dialog = await askToSignOutOthers(screen);
    await dialog.getByRole('button', { name: 'Déconnecter', exact: true }).click();
    await vi.waitFor(() => expect(answer).toBeDefined());
    await dialog.getByRole('button', { name: 'Fermer' }).click();

    answer?.();

    await expect
      .element(screen.getByRole('status').getByText('Tes autres appareils sont déconnectés.'))
      .toBeVisible();
  });
});
