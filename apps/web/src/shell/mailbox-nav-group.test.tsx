import type { MailboxSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi } from '../testing/fake-api.ts';
import { renderApp } from '../testing/render-app.tsx';

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
