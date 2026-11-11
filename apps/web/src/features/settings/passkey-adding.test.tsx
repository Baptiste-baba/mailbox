import { passkeyRegistrationSchema } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { lastBodySentTo } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import { settingsApi } from '../../testing/settings-api.ts';
import {
  addVirtualAuthenticator,
  type VirtualAuthenticator,
} from '../../testing/virtual-authenticator.ts';

let authenticator: VirtualAuthenticator;

beforeEach(async () => {
  authenticator = await addVirtualAuthenticator();
});

afterEach(async () => {
  await authenticator.remove();
  vi.unstubAllGlobals();
});

/** Opens the dialog to add a passkey, names it, and asks to create it. */
async function addPasskeyNamed(screen: AppScreen, name: string) {
  await screen.getByRole('button', { name: 'Ajouter une passkey' }).click();
  const dialog = screen.getByRole('dialog', { name: 'Ajouter une passkey' });
  await userEvent.fill(dialog.getByLabelText('Nom de la passkey'), name);
  await dialog.getByRole('button', { name: 'Créer la passkey' }).click();
  return dialog;
}

describe('adding a passkey', () => {
  test('adds the passkey the password manager creates, under its name', async () => {
    const fetchMock = settingsApi();
    const { screen } = await renderApp('/settings');

    await addPasskeyNamed(screen, 'MacBook');

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole('region', { name: 'Passkeys' }).getByText('MacBook'))
      .toBeVisible();
    const sent = passkeyRegistrationSchema.parse(lastBodySentTo(fetchMock, '/api/auth/passkeys'));
    expect(sent.name).toBe('MacBook');
  });

  test('confirms the identity first with the password and a code, when the api asks', async () => {
    const fetchMock = settingsApi({ confirmationExpired: true });
    const { screen } = await renderApp('/settings');
    const dialog = await addPasskeyNamed(screen, 'MacBook');

    await userEvent.fill(dialog.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.fill(dialog.getByLabelText(/Code à 6 chiffres/), '123456');
    await dialog.getByRole('button', { name: 'Confirmer' }).click();

    await expect
      .element(screen.getByRole('region', { name: 'Passkeys' }).getByText('MacBook'))
      .toBeVisible();
    expect(lastBodySentTo(fetchMock, '/api/auth/identity-confirmation')).toEqual({
      method: 'password',
      password: 'un mot de passe',
      totpCode: '123456',
    });
  });
});

describe('adding a passkey, refused', () => {
  test('asks for a name first', async () => {
    const fetchMock = settingsApi();
    const { screen } = await renderApp('/settings');

    const dialog = await addPasskeyNamed(screen, '  ');

    await expect.element(dialog.getByText('Donne un nom à la passkey.')).toBeVisible();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/auth/passkeys/options')).toBe(false);
  });

  test('says when the password manager keeps a passkey of the app already', async () => {
    settingsApi({ excluded: [authenticator.passkeyId] });
    const { screen } = await renderApp('/settings');

    const dialog = await addPasskeyNamed(screen, 'MacBook');

    await expect.element(dialog.getByRole('alert').getByText(/garde déjà/)).toBeVisible();
  });
});
