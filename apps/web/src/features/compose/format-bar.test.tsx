import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { MODIFIER_KEY as MOD } from '../../testing/modifier-key.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const commonOptions = ['Police', 'Gras', 'Italique', 'Souligné', 'Liste à puces', 'Lien'];
const moreOptions = ['Couleur du texte', 'Barré', 'Centrer', 'Effacer la mise en forme'];

describe('new mail, formatting bar', () => {
  // Regression: the closed menus stayed on screen, over the buttons of the bar.
  test('shows the choices of its menus only once they are opened', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    await screen.getByRole('button', { name: 'Plus de mise en forme' }).click();
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

describe('new mail, formatting bar folded and unfolded', () => {
  test('shows the common options while folded, and all of them once unfolded', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const bar = screen.getByRole('toolbar', { name: 'Mise en forme' });
    for (const name of commonOptions) {
      await expect.element(bar.getByRole('button', { name })).toBeVisible();
    }
    await expect.element(bar.getByRole('spinbutton', { name: 'Taille' })).toBeVisible();
    for (const name of moreOptions) {
      await expect.element(bar.getByRole('button', { name })).not.toBeInTheDocument();
    }

    await bar.getByRole('button', { name: 'Plus de mise en forme' }).click();
    for (const name of [...commonOptions, ...moreOptions]) {
      await expect.element(bar.getByRole('button', { name })).toBeVisible();
    }

    await bar.getByRole('button', { name: 'Moins de mise en forme' }).click();
    await expect.element(bar.getByRole('button', { name: 'Barré' })).not.toBeInTheDocument();
    await expect.element(bar.getByRole('button', { name: 'Plus de mise en forme' })).toHaveFocus();
  });

  test('stays as it was left for the next mails', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    await screen.getByRole('button', { name: 'Plus de mise en forme' }).click();

    await screen.getByRole('button', { name: 'Fermer' }).click();
    await screen.getByRole('button', { name: 'Nouveau mail' }).click();
    await expect.element(screen.getByRole('button', { name: 'Barré' })).toBeVisible();

    await screen.getByRole('button', { name: 'Moins de mise en forme' }).click();
    await screen.getByRole('button', { name: 'Fermer' }).click();
    await screen.getByRole('button', { name: 'Nouveau mail' }).click();
    await expect.element(screen.getByRole('button', { name: 'Gras' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Barré' })).not.toBeInTheDocument();
  });
});

describe('new mail, formatting bar folded', () => {
  test('keeps the shortcuts of the options it folds away', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const message = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(message, 'Important');

    await userEvent.keyboard(`{${MOD}>}{Shift>}e{/Shift}{/${MOD}}`);

    await expect.element(message.getByText('Important')).toHaveStyle({ textAlign: 'center' });
    await expect.element(screen.getByRole('button', { name: 'Centrer' })).not.toBeInTheDocument();
  });
});
