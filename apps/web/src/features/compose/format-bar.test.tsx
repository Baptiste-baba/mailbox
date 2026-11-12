import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  localStorage.clear();
  await page.viewport(1440, 900);
});

const commonOptions = [
  'Police',
  'Couleur du texte',
  'Gras',
  'Italique',
  'Souligné',
  'Liste à puces',
  'Lien',
];
const moreOptions = ['Barré', 'Centrer', 'Liste numérotée', 'Effacer la mise en forme'];

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
    await userEvent.keyboard(`{ControlOrMeta>}a{/ControlOrMeta}`);

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

    await userEvent.keyboard(`{ControlOrMeta>}{Shift>}e{/Shift}{/ControlOrMeta}`);

    await expect.element(message.getByText('Important')).toHaveStyle({ textAlign: 'center' });
    await expect.element(screen.getByRole('button', { name: 'Centrer' })).not.toBeInTheDocument();
  });
});

/** The rows a toolbar takes, from where its controls sit. */
function rowsOf(toolbar: Element): number {
  return new Set([...toolbar.children].map((control) => control.getBoundingClientRect().top)).size;
}

describe('new mail, formatting bar folded, in a narrow window', () => {
  test('stays on one line in a window 1280 px wide, whatever the font', async () => {
    await page.viewport(1280, 800);
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const bar = screen.getByRole('toolbar', { name: 'Mise en forme', exact: true });
    await expect.element(bar).toBeVisible();

    await bar.getByRole('button', { name: 'Police' }).click();
    await screen.getByRole('menuitemradio', { name: 'Times New Roman' }).click();

    await expect
      .element(bar.getByRole('button', { name: 'Police' }))
      .toHaveTextContent('Times New Roman');
    expect(rowsOf(bar.element())).toBe(1);
  });
});
