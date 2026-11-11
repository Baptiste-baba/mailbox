import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, testThread } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Writes a new mail with a recipient, a copy, a subject and a message. */
async function writeMail(screen: AppScreen) {
  await userEvent.keyboard('camille@exemple.fr{Enter}');
  await screen.getByRole('button', { name: 'Cc', exact: true }).click();
  await userEvent.keyboard('hugo@exemple.fr{Enter}');
  await userEvent.type(screen.getByRole('textbox', { name: 'Objet' }), 'Dîner samedi');
  await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Tu viens à 20 h ?');
}

describe('new mail, draft', () => {
  test('keeps what was written once closed, and gives it back on "Nouveau mail"', async () => {
    fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
    });
    const { screen } = await renderApp('/inbox/new');
    await writeMail(screen);

    await userEvent.keyboard('{Escape}');
    await screen.getByText('Sujet thread-a', { exact: true }).click();
    await screen.getByRole('button', { name: 'Nouveau mail' }).click();

    await expect.element(screen.getByText('camille@exemple.fr')).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Cc' })).toBeVisible();
    await expect.element(screen.getByText('hugo@exemple.fr')).toBeVisible();
    await expect
      .element(screen.getByRole('textbox', { name: 'Objet' }))
      .toHaveValue('Dîner samedi');
    await expect
      .element(screen.getByRole('textbox', { name: 'Message' }))
      .toHaveValue('Tu viens à 20 h ?');
  });

  test('throws the draft away with the trash, and closes', async () => {
    fakeApi();
    const { screen, router } = await renderApp('/inbox/new');
    await writeMail(screen);

    await screen.getByRole('button', { name: 'Supprimer le brouillon' }).click();
    await expect
      .element(screen.getByRole('heading', { name: 'Nouveau mail' }))
      .not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/inbox');

    await screen.getByRole('button', { name: 'Nouveau mail' }).click();
    await expect.element(screen.getByRole('textbox', { name: 'Objet' })).toHaveValue('');
    await expect.element(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
    await expect.element(screen.getByText('camille@exemple.fr')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('textbox', { name: 'Cc' })).not.toBeInTheDocument();
  });
});
