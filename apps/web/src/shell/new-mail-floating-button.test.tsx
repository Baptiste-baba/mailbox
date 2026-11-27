import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeThreads } from '../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

function floatingButton(screen: AppScreen) {
  return screen.getByRole('button', { name: 'Nouveau mail' });
}

describe('"Nouveau" floating over the list', () => {
  test('opens the new mail over the whole screen of a phone', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen, router } = await renderApp('/inbox');

    await floatingButton(screen).click();

    await expect.poll(() => router.state.location.pathname).toBe('/inbox/new');
    await expect.element(screen.getByRole('textbox', { name: 'Objet' })).toBeVisible();
  });

  test.each([
    ['an open mail', '/inbox/thread-1', 'Corps de thread-1'],
    ['the new mail', '/inbox/new', 'Nouveau mail'],
    ['the settings', '/settings', 'Réglages'],
  ])('is not over %s', async (_, path, shown) => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen } = await renderApp(path);
    await expect.element(screen.getByText(shown, { exact: true }).first()).toBeVisible();

    expect(floatingButton(screen).query()).toBeNull();
  });
});

describe('"Nouveau" and the list beneath', () => {
  test('lets the last card scroll clear of it', async () => {
    fakeThreads(40);
    await page.viewport(390, 844);
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-0', { exact: true })).toBeVisible();
    const scroller = screen.getByRole('list').element().parentElement;
    scroller?.scrollTo({ top: scroller.scrollHeight });

    const lastCard = screen.getByRole('link', { name: /Sujet thread-39\b/ });
    await expect.element(lastCard).toBeVisible();
    const cardBottom = lastCard.element().getBoundingClientRect().bottom;
    expect(cardBottom).toBeLessThanOrEqual(
      floatingButton(screen).element().getBoundingClientRect().top,
    );
  });

  test('stays at the bottom right of the list on a phone turned sideways', async () => {
    fakeThreads(3);
    await page.viewport(844, 390);
    const { screen } = await renderApp('/inbox/thread-1');
    await expect.element(floatingButton(screen)).toBeVisible();

    const list = screen.getByRole('region', { name: 'Liste des mails' }).element();
    const button = floatingButton(screen).element().getBoundingClientRect();
    expect(button.right).toBeLessThanOrEqual(list.getBoundingClientRect().right);
  });
});
