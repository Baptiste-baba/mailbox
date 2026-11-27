import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, serverError } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';
import { mailboxSection, personalMailbox, workMailbox } from '../../testing/test-mailboxes.ts';

const work: MailboxSummary = { ...workMailbox, status: 'reconnectRequired' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('settings, mailboxes', () => {
  test('lists the connected mailboxes, with their address and whether their access holds', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [personalMailbox, work] }) });
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
    fakeApi({ mailboxes: () => (failing ? serverError() : { mailboxes: [personalMailbox] }) });
    const { screen } = await renderApp('/settings');
    const section = mailboxSection(screen);
    await expect.element(section.getByText('Impossible de charger tes boîtes.')).toBeVisible();

    failing = false;
    await section.getByRole('button', { name: 'Réessayer' }).click();

    await expect.element(section.getByText('alex.martin@example.com')).toBeVisible();
  });
});
