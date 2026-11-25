import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, serverError } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

function mailboxSection(screen: AppScreen) {
  return screen.getByRole('region', { name: 'Boîtes mail' });
}

describe('settings, mailboxes', () => {
  test('lists the connected mailboxes, with their address and whether their access holds', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [personal, work] }) });
    const { screen } = await renderApp('/settings');
    const row = (name: string) =>
      mailboxSection(screen).getByRole('listitem').filter({ hasText: name });

    await expect.element(row('Perso').getByText('alex.martin@example.com')).toBeVisible();
    await expect.element(row('Perso').getByText('Connectée')).toBeVisible();
    await expect.element(row('Travail').getByText('alex@studio.example')).toBeVisible();
    await expect.element(row('Travail').getByText('Reconnexion nécessaire')).toBeVisible();
  });

  test('says when no mailbox is connected yet', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [] }) });
    const { screen } = await renderApp('/settings');

    await expect
      .element(mailboxSection(screen).getByText('Aucune boîte connectée pour l’instant.'))
      .toBeVisible();
  });

  test('explains a failure to load the mailboxes, and offers to try again', async () => {
    let failing = true;
    fakeApi({ mailboxes: () => (failing ? serverError() : { mailboxes: [personal] }) });
    const { screen } = await renderApp('/settings');
    const section = mailboxSection(screen);
    await expect.element(section.getByText('Impossible de charger tes boîtes.')).toBeVisible();

    failing = false;
    await section.getByRole('button', { name: 'Réessayer' }).click();

    await expect.element(section.getByText('alex.martin@example.com')).toBeVisible();
  });
});
