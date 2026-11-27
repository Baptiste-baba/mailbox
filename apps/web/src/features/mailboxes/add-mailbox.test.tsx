import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, lastBodySentTo, noContent } from '../../testing/fake-api.ts';
import { holdDepartures } from '../../testing/hold-departures.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';
import { GOOGLE_PAGE, toGoogle, workMailbox } from '../../testing/test-mailboxes.ts';

let departures: ReturnType<typeof holdDepartures>;

beforeEach(() => {
  departures = holdDepartures();
});

afterEach(() => {
  departures.release();
  vi.unstubAllGlobals();
});

async function openDialog(screen: AppScreen) {
  await screen.getByRole('button', { name: 'Ajouter une boîte' }).click();
  return screen.getByRole('dialog', { name: 'Ajouter une boîte Gmail' });
}

describe('adding a mailbox', () => {
  test('leaves for Google with the name and the colour chosen', async () => {
    const fetchMock = fakeApi({ startMailboxConnection: toGoogle });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);

    await userEvent.fill(dialog.getByLabelText('Nom de la boîte'), '  Perso ');
    await dialog.getByTitle('Glacier').click();
    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect.poll(() => departures.destinations).toEqual([GOOGLE_PAGE]);
    expect(lastBodySentTo(fetchMock, '/api/mailboxes/connection')).toEqual({
      provider: 'gmail',
      name: 'Perso',
      color: 'glacier',
    });
  });

  test('suggests the first colour no mailbox has yet', async () => {
    fakeApi({ mailboxes: () => ({ mailboxes: [workMailbox] }) });
    const { screen } = await renderApp('/settings');

    const dialog = await openDialog(screen);

    await expect.element(dialog.getByRole('radio', { name: 'Azur' })).toBeChecked();
  });

  test('asks for a name before going anywhere', async () => {
    const fetchMock = fakeApi({ startMailboxConnection: toGoogle });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);

    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect.element(dialog.getByText('Donne un nom à la boîte.')).toBeVisible();
    expect(lastBodySentTo(fetchMock, '/api/mailboxes/connection')).toBeUndefined();
  });
});

describe('adding a mailbox, when something stands in the way', () => {
  test('confirms the identity first when the api asks, then leaves for Google', async () => {
    let confirmed = false;
    fakeApi({
      startMailboxConnection: () =>
        confirmed ? toGoogle() : apiError(403, 'IDENTITY_CONFIRMATION_REQUIRED')(),
      confirmIdentity: () => {
        confirmed = true;
        return noContent();
      },
    });
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await userEvent.fill(dialog.getByLabelText('Nom de la boîte'), 'Perso');
    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect
      .element(dialog.getByText('Pour connecter une boîte, confirme d’abord que c’est toi.'))
      .toBeVisible();
    await userEvent.fill(dialog.getByLabelText('Mot de passe', { exact: true }), 'un mot de passe');
    await userEvent.fill(dialog.getByLabelText(/Code à 6 chiffres/), '123456');
    await dialog.getByRole('button', { name: 'Confirmer' }).click();

    await expect.poll(() => departures.destinations).toEqual([GOOGLE_PAGE]);
  });

  test('says so when the server fails, and stays in the app', async () => {
    fakeApi();
    const { screen } = await renderApp('/settings');
    const dialog = await openDialog(screen);
    await userEvent.fill(dialog.getByLabelText('Nom de la boîte'), 'Perso');

    await dialog.getByRole('button', { name: 'Continuer chez Google' }).click();

    await expect
      .element(dialog.getByText('Le serveur a rencontré un problème. Réessaie dans un instant.'))
      .toBeVisible();
    expect(departures.destinations).toEqual([]);
  });
});

describe('a server without a Google client', () => {
  test('offers no mailbox to add, and says why', async () => {
    fakeApi({ mailProviders: () => ({ providers: [] }) });
    const { screen } = await renderApp('/settings');
    const section = screen.getByRole('region', { name: 'Boîtes mail' });

    await expect
      .element(section.getByText(/Ce serveur n’est pas encore configuré pour Gmail/))
      .toBeVisible();
    await expect.element(section.getByRole('button', { name: 'Ajouter une boîte' })).toBeDisabled();
  });
});
