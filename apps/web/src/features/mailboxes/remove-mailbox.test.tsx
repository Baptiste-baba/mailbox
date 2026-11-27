import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, noContent, testThread } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import { mailboxSection, personalMailbox, workMailbox } from '../../testing/test-mailboxes.ts';

const REMOVAL_PATH = `/api/mailboxes/${workMailbox.id}`;

afterEach(() => {
  vi.unstubAllGlobals();
});

const workThread = { ...testThread('thread-work', false), mailboxId: workMailbox.id };

/**
 * The api of a server keeping both mailboxes until `refusal` lets one go. Once the mailbox of the
 * only thread is gone, the list of threads never answers: what shows then comes from the cache.
 */
function mailboxApi(refusal?: () => Response | undefined) {
  let stored = [personalMailbox, workMailbox];
  return fakeApi({
    mailboxes: () => ({ mailboxes: stored }),
    threadPages: () =>
      stored.includes(workMailbox)
        ? { threads: [workThread], nextCursor: null }
        : new Promise<never>(() => undefined),
    removeMailbox: (mailboxId) => {
      const refused = refusal?.();
      if (refused !== undefined) {
        return refused;
      }
      stored = stored.filter((mailbox) => mailbox.id !== mailboxId);
      return noContent();
    },
    confirmIdentity: noContent,
  });
}

function removalsAsked(fetchMock: ReturnType<typeof fakeApi>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE').map(([url]) => url);
}

async function openDialog(screen: AppScreen) {
  await screen.getByRole('button', { name: 'Retirer la boîte « Travail »' }).click();
  return screen.getByRole('dialog', { name: 'Retirer la boîte « Travail » ?' });
}

describe('removing a mailbox', () => {
  test('removes it once the user said so, and keeps the other ones', async () => {
    const fetchMock = mailboxApi();
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await expect.element(dialog.getByText(/Rien n’est supprimé dans ta boîte Gmail/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Retirer' }).click();

    await expect.element(dialog).not.toBeInTheDocument();
    const section = mailboxSection(screen);
    await expect.element(section.getByText('alex@studio.example')).not.toBeInTheDocument();
    await expect.element(section.getByText('alex.martin@example.com')).toBeVisible();
    expect(removalsAsked(fetchMock)).toEqual([REMOVAL_PATH]);
  });

  test('removes nothing when the user changes their mind', async () => {
    const fetchMock = mailboxApi();
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);

    await dialog.getByRole('button', { name: 'Annuler' }).click();

    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(mailboxSection(screen).getByText('alex@studio.example')).toBeVisible();
    expect(removalsAsked(fetchMock)).toEqual([]);
  });

  test('no longer shows the mail read from it earlier', async () => {
    mailboxApi();
    const { screen, router } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-work')).toBeVisible();
    await router.navigate({ to: '/settings' });
    const dialog = await openDialog(screen);
    await dialog.getByRole('button', { name: 'Retirer' }).click();
    await expect.element(dialog).not.toBeInTheDocument();

    await router.navigate({ to: '/$view', params: { view: 'inbox' } });

    await expect.element(screen.getByLabelText('Rechercher dans la réception')).toBeVisible();
    await expect.element(screen.getByText('Sujet thread-work')).not.toBeInTheDocument();
  });
});

describe('removing a mailbox, when something stands in the way', () => {
  test('confirms the identity first when the api asks, then removes it', async () => {
    let asked = false;
    mailboxApi(() => {
      if (asked) {
        return undefined;
      }
      asked = true;
      return apiError(403, 'IDENTITY_CONFIRMATION_REQUIRED')();
    });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await dialog.getByRole('button', { name: 'Retirer' }).click();

    await expect
      .element(dialog.getByText('Pour retirer une boîte, confirme d’abord que c’est toi.'))
      .toBeVisible();
    await userEvent.fill(dialog.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.fill(dialog.getByLabelText(/Code à 6 chiffres/), '123456');
    await dialog.getByRole('button', { name: 'Confirmer' }).click();

    await expect.element(dialog).not.toBeInTheDocument();
    await expect
      .element(mailboxSection(screen).getByText('alex@studio.example'))
      .not.toBeInTheDocument();
  });

  test('keeps the mailbox and says so when Google does not answer', async () => {
    mailboxApi(apiError(502, 'MAIL_PROVIDER_UNAVAILABLE'));
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);

    await dialog.getByRole('button', { name: 'Retirer' }).click();

    await expect
      .element(dialog.getByText(/Google ne répond pas, la boîte n’a pas été retirée/))
      .toBeVisible();
    await expect.element(mailboxSection(screen).getByText('alex@studio.example')).toBeVisible();
  });
});
