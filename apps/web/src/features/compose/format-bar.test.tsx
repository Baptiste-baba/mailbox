import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { MODIFIER_KEY as MOD } from '../../testing/modifier-key.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('new mail, formatting bar', () => {
  // Regression: the closed menus stayed on screen, over the buttons of the bar.
  test('shows the choices of its menus only once they are opened', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    await expect.element(screen.getByRole('button', { name: 'Police' })).toBeVisible();

    for (const name of ['Police', 'Couleur du texte']) {
      await expect
        .element(screen.getByRole('menu', { name, includeHidden: true }))
        .not.toBeVisible();
    }
    await screen.getByRole('button', { name: 'Lien' }).click();
    await expect.element(screen.getByRole('textbox', { name: 'Adresse' })).toBeVisible();
  });

  // Regression: text made very large climbed out of the message, over the subject.
  test('makes room in the message for text made very large', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const message = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(message, 'Grand');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);

    await userEvent.click(screen.getByRole('spinbutton', { name: 'Taille' }));
    await userEvent.keyboard('100{Enter}');

    await expect.element(message).toHaveTextContent('Grand');
    const text = screen.getByText('Grand').element().getBoundingClientRect();
    expect(text.top).toBeGreaterThanOrEqual(message.element().getBoundingClientRect().top);
  });
});
