import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';
import { personalMailbox, workMailbox } from '../../testing/test-mailboxes.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mail list, without a thread', () => {
  test('invites to connect a mailbox when there is none, and leads to the settings', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [] }) });
    const { screen, router } = await renderApp('/inbox');
    const list = screen.getByRole('region', { name: 'Liste des mails' });
    await expect
      .element(list.getByText(/Connecte ta boîte mail pour retrouver tes mails ici/))
      .toBeVisible();

    await list.getByRole('button', { name: 'Connecter une boîte' }).click();

    await expect.element(screen.getByRole('heading', { name: 'Boîtes mail' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
  });

  test('says there is no mail when a mailbox is connected', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox');
    const list = screen.getByRole('region', { name: 'Liste des mails' });

    await expect.element(list.getByText('Aucun mail ici.')).toBeVisible();
    expect(list.getByRole('button', { name: 'Connecter une boîte' }).query()).toBeNull();
  });
});

describe('mail list, without a thread, while mails are being copied', () => {
  const copying = {
    ...personalMailbox,
    sync: { state: 'copying', copiedCount: 0, totalCount: 9761 },
  } as const;

  test('says the mails of the mailbox are still being copied', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [copying, workMailbox] }) });
    const { screen } = await renderApp('/inbox');
    const list = screen.getByRole('region', { name: 'Liste des mails' });

    await expect
      .element(
        list.getByText('Copie de tes mails en cours. Ils apparaissent ici au fur et à mesure.'),
      )
      .toBeVisible();
  });

  test('says there is no mail in a mailbox copied already, whatever the others', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [copying, workMailbox] }) });
    const { screen } = await renderApp(`/inbox?mailbox=${workMailbox.id}`);
    const list = screen.getByRole('region', { name: 'Liste des mails' });

    await expect.element(list.getByText('Aucun mail ici.')).toBeVisible();
  });
});
