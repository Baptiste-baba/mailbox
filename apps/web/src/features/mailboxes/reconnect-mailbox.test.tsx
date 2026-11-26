import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, noContent } from '../../testing/fake-api.ts';
import { holdDepartures } from '../../testing/hold-departures.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

const GOOGLE_PAGE = 'https://accounts.google.com/o/oauth2/v2/auth?state=the-state';
const toGoogle = () => ({ authorizationUrl: GOOGLE_PAGE });
const personal: MailboxSummary = {
  id: '5d0c1b7e-3f2a-4c8d-9b6e-1a2b3c4d5e6f',
  provider: 'gmail',
  name: 'Perso',
  address: 'alex.martin@example.com',
  color: 'azur',
  unreadCount: 3,
  status: 'connected',
};
const work: MailboxSummary = {
  id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  provider: 'gmail',
  name: 'Travail',
  address: 'alex@studio.example',
  color: 'navy',
  unreadCount: 0,
  status: 'reconnectRequired',
};
const mailboxes = () => ({ mailboxes: [personal, work] });

let departures: ReturnType<typeof holdDepartures>;

beforeEach(() => {
  departures = holdDepartures();
});

afterEach(() => {
  departures.release();
  vi.unstubAllGlobals();
});

function mailboxSection(screen: AppScreen) {
  return screen.getByRole('region', { name: 'Boîtes mail' });
}

async function openDialog(screen: AppScreen) {
  await mailboxSection(screen)
    .getByRole('button', { name: 'Reconnecter la boîte « Travail »' })
    .click();
  return screen.getByRole('dialog', { name: 'Reconnecter la boîte « Travail »' });
}

describe('reconnecting a mailbox', () => {
  test('is offered for the mailboxes whose access no longer holds, and for no other', async () => {
    fakeApi({ mailboxes });
    const { screen } = await renderApp('/settings');
    const section = mailboxSection(screen);

    await expect
      .element(section.getByRole('button', { name: 'Reconnecter la boîte « Travail »' }))
      .toBeVisible();
    await expect
      .element(section.getByRole('button', { name: 'Reconnecter la boîte « Perso »' }))
      .not.toBeInTheDocument();
  });

  test('says which account to sign in with, then leaves for Google', async () => {
    const startMailboxReconnection = vi.fn(toGoogle);
    fakeApi({ mailboxes, startMailboxReconnection });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await expect
      .element(dialog.getByText(/Connecte-toi chez Google avec alex@studio.example/))
      .toBeVisible();

    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect.poll(() => departures.destinations).toEqual([GOOGLE_PAGE]);
    expect(startMailboxReconnection.mock.calls).toEqual([[work.id]]);
  });
});

describe('reconnecting a mailbox, when something stands in the way', () => {
  test('confirms the identity first when the api asks, then leaves for Google', async () => {
    let confirmed = false;
    fakeApi({
      mailboxes,
      startMailboxReconnection: () =>
        confirmed ? toGoogle() : apiError(403, 'IDENTITY_CONFIRMATION_REQUIRED')(),
      confirmIdentity: () => {
        confirmed = true;
        return noContent();
      },
    });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect
      .element(dialog.getByText('Pour connecter une boîte, confirme d’abord que c’est toi.'))
      .toBeVisible();
    await userEvent.fill(dialog.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.fill(dialog.getByLabelText(/Code à 6 chiffres/), '123456');
    await dialog.getByRole('button', { name: 'Confirmer' }).click();

    await expect.poll(() => departures.destinations).toEqual([GOOGLE_PAGE]);
  });

  test('stays in the app and says so when the mailbox was removed meanwhile', async () => {
    fakeApi({ mailboxes, startMailboxReconnection: apiError(404, 'MAILBOX_NOT_FOUND') });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);

    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect.element(dialog.getByText(/Cette boîte a été retirée entre-temps/)).toBeVisible();
    expect(departures.destinations).toEqual([]);
  });
});
