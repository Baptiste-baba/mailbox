import type { PasskeySummary } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeApi } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import { lastBodySentTo, settingsApi } from '../../testing/settings-api.ts';
import {
  addVirtualAuthenticator,
  type VirtualAuthenticator,
} from '../../testing/virtual-authenticator.ts';

const iphone: PasskeySummary = {
  id: '0b9d5c3e-7a41-4f2e-9c1d-3e5f6a7b8c9d',
  name: 'iPhone',
  createdAt: '2026-01-14T09:00:00.000Z',
  lastUsedAt: null,
};

let authenticator: VirtualAuthenticator;

beforeEach(async () => {
  authenticator = await addVirtualAuthenticator();
});

afterEach(async () => {
  await authenticator.remove();
  vi.unstubAllGlobals();
});

/** Asks to remove the iPhone passkey, from its row. */
async function askToRemoveIphone(screen: AppScreen) {
  await screen.getByRole('button', { name: /Retirer la passkey «\s?iPhone/ }).click();
  return screen.getByRole('dialog', { name: /Retirer la passkey «\s?iPhone\s?»\s?\?/ });
}

function removals(fetchMock: ReturnType<typeof settingsApi>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');
}

describe('removing a passkey', () => {
  test('removes the passkey once the dialog confirms it', async () => {
    const fetchMock = settingsApi({ passkeys: [iphone] });
    const { screen } = await renderApp('/settings');
    const dialog = await askToRemoveIphone(screen);

    await dialog.getByRole('button', { name: 'Retirer' }).click();

    await expect.element(screen.getByText('Aucune passkey pour l’instant.')).toBeVisible();
    expect(removals(fetchMock).map(([url]) => url)).toEqual([`/api/auth/passkeys/${iphone.id}`]);
  });

  test('confirms the identity with a passkey first, when the api asks', async () => {
    const fetchMock = settingsApi({ passkeys: [iphone], confirmationExpired: true });
    const { screen } = await renderApp('/settings');
    const dialog = await askToRemoveIphone(screen);
    await dialog.getByRole('button', { name: 'Retirer' }).click();

    await dialog.getByRole('button', { name: 'Confirmer avec une passkey' }).click();

    await expect.element(screen.getByText('Aucune passkey pour l’instant.')).toBeVisible();
    expect(lastBodySentTo(fetchMock, '/api/auth/identity-confirmation')).toMatchObject({
      method: 'passkey',
      response: { id: authenticator.passkeyId },
    });
    expect(removals(fetchMock)).toHaveLength(2);
  });

  test('keeps the passkey when the removal is cancelled', async () => {
    const fetchMock = settingsApi({ passkeys: [iphone] });
    const { screen } = await renderApp('/settings');
    const dialog = await askToRemoveIphone(screen);

    await dialog.getByRole('button', { name: 'Annuler' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    await expect.element(screen.getByText('iPhone')).toBeVisible();
    expect(removals(fetchMock)).toHaveLength(0);
  });
});

describe('removing a passkey, the dialog closed meanwhile', () => {
  // Regression: closing the dialog while the removal ran left the removed passkey in the list.
  test('drops the passkey from the list once removed, the dialog closed or not', async () => {
    let stored = [iphone];
    let answer: (() => void) | undefined;
    fakeApi({
      passkeys: () => ({ passkeys: stored }),
      removePasskey: () =>
        new Promise((resolve) => {
          answer = () => {
            stored = [];
            resolve(new Response(null, { status: 204 }));
          };
        }),
    });
    const { screen } = await renderApp('/settings');
    const dialog = await askToRemoveIphone(screen);
    await dialog.getByRole('button', { name: 'Retirer' }).click();
    await vi.waitFor(() => expect(answer).toBeDefined());
    await dialog.getByRole('button', { name: 'Fermer' }).click();

    answer?.();

    await expect.element(screen.getByText('Aucune passkey pour l’instant.')).toBeVisible();
  });
});
