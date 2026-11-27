import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi } from '../testing/fake-api.ts';
import { renderApp } from '../testing/render-app.tsx';
import { workMailbox } from '../testing/test-mailboxes.ts';

const work: MailboxSummary = { ...workMailbox, status: 'reconnectRequired' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sidebar, mailboxes', () => {
  test('leads to the settings to manage the mailboxes', async () => {
    fakeApi();
    const { screen, router } = await renderApp('/inbox');

    await screen.getByRole('navigation').getByRole('button', { name: 'Gérer' }).click();

    await expect.element(screen.getByRole('heading', { name: 'Boîtes mail' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });

  test('leads to the settings to reconnect a mailbox, which still opens from its row', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [work] }) });
    const { screen, router } = await renderApp('/inbox');
    const sidebar = screen.getByRole('navigation');
    await expect
      .element(sidebar.getByRole('link', { name: /alex@studio.example/ }))
      .toHaveAttribute('href', `/inbox?mailbox=${work.id}`);

    await sidebar.getByRole('link', { name: 'Reconnecter la boîte « Travail »' }).click();

    await expect
      .element(screen.getByRole('button', { name: 'Reconnecter la boîte « Travail »' }))
      .toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });
});

describe('sidebar, a mailbox not read for a while', () => {
  test('says so on hover, in place of its unread count', async () => {
    const interrupted: MailboxSummary = {
      ...workMailbox,
      unreadCount: 4,
      sync: {
        state: 'interrupted',
        since: '2026-11-27T09:00:00.000Z',
        reason: 'providerUnavailable',
      },
    };
    fakeApi({ mailboxes: () => ({ mailboxes: [interrupted] }) });
    const { screen } = await renderApp('/inbox');
    const link = screen.getByRole('navigation').getByRole('link', { name: /alex@studio.example/ });

    await expect
      .element(link)
      .toHaveAttribute('title', expect.stringContaining('Synchronisation interrompue'));
    expect(link.getByText('4').query()).toBeNull();
  });
});
