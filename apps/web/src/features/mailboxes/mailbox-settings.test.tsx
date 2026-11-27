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
    await expect.element(row('Perso').getByText('À jour')).toBeVisible();
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

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** The row of the only mailbox of the settings, with the given synchronisation. */
async function rowWith(sync: MailboxSummary['sync']) {
  fakeApi({ mailboxes: () => ({ mailboxes: [{ ...personalMailbox, sync }] }) });
  const { screen } = await renderApp('/settings');
  return mailboxSection(screen).getByRole('listitem');
}

describe('settings, how the synchronisation of a mailbox goes', () => {
  test('tells a mailbox up to date, and when it was last read', async () => {
    const checkedAt = new Date();
    checkedAt.setHours(14, 32);

    const row = await rowWith({ state: 'upToDate', checkedAt: checkedAt.toISOString() });

    await expect.element(row.getByText('À jour')).toHaveAttribute('title', 'Vérifiée à 14:32');
  });

  test('tells the progress of a copy, in mails and on a bar', async () => {
    const row = await rowWith({ state: 'copying', copiedCount: 1234, totalCount: 9761 });

    await expect.element(row.getByText('Copie en cours · 1\u202f234 sur 9\u202f761')).toBeVisible();
    await expect
      .element(row.getByRole('meter', { name: 'Avancement de la copie' }))
      .toHaveAttribute('value', '1234');
  });

  test('tells a copy that has not yet counted the mails', async () => {
    const row = await rowWith({ state: 'copying', copiedCount: 0, totalCount: null });

    await expect.element(row.getByText('Copie en cours', { exact: true })).toBeVisible();
    expect(row.getByRole('meter').query()).toBeNull();
  });
});

describe('settings, a mailbox not read for a while', () => {
  test('tells it interrupted, since when and why', async () => {
    const row = await rowWith({
      state: 'interrupted',
      since: minutesAgo(25),
      reason: 'providerUnavailable',
    });

    await expect.element(row.getByText('Synchronisation interrompue')).toBeVisible();
    await expect
      .element(row.getByText('Google ne répond pas depuis 25 min. MailBox réessaie chaque minute.'))
      .toBeVisible();
  });

  test('says what to do when the server lost its Google client', async () => {
    const row = await rowWith({
      state: 'interrupted',
      since: minutesAgo(90),
      reason: 'providerNotConfigured',
    });

    await expect
      .element(row.getByText(/Vérifie GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET/))
      .toBeVisible();
  });

  test('asks to reconnect a mailbox Google no longer lets in, whatever its synchronisation', async () => {
    fakeApi({
      mailboxes: () => ({
        mailboxes: [
          {
            ...personalMailbox,
            status: 'reconnectRequired',
            sync: { state: 'interrupted', since: minutesAgo(90), reason: 'unexpected' },
          },
        ],
      }),
    });
    const { screen } = await renderApp('/settings');
    const row = mailboxSection(screen).getByRole('listitem');

    await expect.element(row.getByText('Reconnexion nécessaire')).toBeVisible();
    expect(row.getByText('Synchronisation interrompue').query()).toBeNull();
  });
});
