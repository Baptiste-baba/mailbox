import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fakeThreads } from '../../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  localStorage.clear();
  await page.viewport(1440, 900);
});

async function writeOnPhone(width = 390) {
  fakeThreads(3);
  await page.viewport(width, 844);
  const rendered = await renderApp('/inbox');
  await rendered.screen.getByRole('button', { name: 'Nouveau mail' }).click();
  await userEvent.type(rendered.screen.getByRole('textbox', { name: 'Objet' }), 'Dîner samedi');
  return rendered;
}

function subjectField(screen: AppScreen) {
  return screen.getByRole('textbox', { name: 'Objet' });
}

describe('new mail on a phone', () => {
  test('closes on the list, keeping what was written', async () => {
    const { screen, router } = await writeOnPhone();

    await screen.getByRole('button', { name: 'Fermer' }).click();
    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
    await screen.getByRole('button', { name: 'Nouveau mail' }).click();

    await expect.element(subjectField(screen)).toHaveValue('Dîner samedi');
  });

  test('throws the draft away from the trash', async () => {
    const { screen, router } = await writeOnPhone();

    await screen.getByRole('button', { name: 'Supprimer le brouillon' }).click();
    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
    await screen.getByRole('button', { name: 'Nouveau mail' }).click();

    await expect.element(subjectField(screen)).toHaveValue('');
  });
});

describe('top of a new mail on a phone', () => {
  test('names the screen between the way to close and "Envoyer"', async () => {
    const { screen } = await writeOnPhone();

    const close = screen.getByRole('button', { name: 'Fermer' }).element().getBoundingClientRect();
    const title = screen.getByRole('heading', { name: 'Nouveau mail' }).element();
    const send = screen.getByRole('button', { name: 'Envoyer' }).element().getBoundingClientRect();
    expect(title.getBoundingClientRect().left).toBeGreaterThan(close.right);
    expect(title.getBoundingClientRect().right).toBeLessThan(send.left);
  });

  test('shows "Envoyer" at the top, above the fields', async () => {
    const { screen } = await writeOnPhone();

    const send = screen.getByRole('button', { name: 'Envoyer' }).element();
    const subject = subjectField(screen).element();
    expect(send.getBoundingClientRect().bottom).toBeLessThan(subject.getBoundingClientRect().top);
  });

  test.each([390, 375])(
    'gathers formatting, attaching and the trash in one line at the foot, %i px wide',
    async (width) => {
      const { screen } = await writeOnPhone(width);
      const bar = screen.getByRole('toolbar', { name: 'Mise en forme' });

      for (const name of ['Gras', 'Italique', 'Souligné', 'Liste à puces', 'Lien']) {
        await expect.element(bar.getByRole('button', { name })).toBeVisible();
      }
      await expect.element(bar.getByRole('button', { name: 'Joindre un fichier' })).toBeVisible();
      await expect
        .element(bar.getByRole('button', { name: 'Supprimer le brouillon' }))
        .toBeVisible();
      expect(bar.getByRole('button', { name: 'Police' }).query()).toBeNull();
      expect(bar.element().getBoundingClientRect().height).toBeLessThan(60);
    },
  );
});
