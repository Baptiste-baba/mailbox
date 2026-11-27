import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, noContent } from '../../testing/fake-api.ts';
import { holdDepartures } from '../../testing/hold-departures.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import {
  GOOGLE_PAGE,
  mailboxSection,
  personalMailbox,
  toGoogle,
  workMailbox,
} from '../../testing/test-mailboxes.ts';

const work: MailboxSummary = { ...workMailbox, status: 'reconnectRequired' };
const mailboxes = () => ({ mailboxes: [personalMailbox, work] });

let departures: ReturnType<typeof holdDepartures>;

beforeEach(() => {
  departures = holdDepartures();
});

afterEach(() => {
  departures.release();
  vi.unstubAllGlobals();
});

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
