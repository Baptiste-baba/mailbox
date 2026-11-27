import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fakeApi, testThread } from '../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

async function openMenu(screen: AppScreen) {
  await screen.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const menu = screen.getByRole('dialog', { name: 'Menu' });
  await expect.element(menu).toBeVisible();
  return menu;
}

async function showInbox(width: number, height: number) {
  fakeApi({ threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }) });
  await page.viewport(width, height);
  const rendered = await renderApp('/inbox');
  await expect.element(rendered.screen.getByText('Sujet thread-a')).toBeVisible();
  return rendered;
}

describe('menu on a phone', () => {
  test('opens the sidebar from ☰, without "Nouveau mail"', async () => {
    const { screen } = await showInbox(390, 844);
    const menu = await openMenu(screen);

    await expect.element(menu.getByRole('link', { name: /Réception/ })).toBeVisible();
    await expect.element(menu.getByRole('link', { name: 'Réglages' })).toBeVisible();
    expect(menu.getByRole('button', { name: 'Nouveau mail' }).query()).toBeNull();
  });

  test('closes once a place is chosen, and shows that place', async () => {
    const { screen, router } = await showInbox(390, 844);
    const menu = await openMenu(screen);

    await menu.getByRole('link', { name: 'Réglages' }).click();

    await expect.poll(() => router.state.location.pathname).toBe('/settings');
    await expect.poll(() => screen.getByRole('dialog').query()).toBeNull();
  });

  test('closes when the place chosen is the one on screen', async () => {
    const { screen } = await showInbox(390, 844);
    const menu = await openMenu(screen);

    await menu.getByRole('link', { name: /Réception/ }).click();

    await expect.poll(() => screen.getByRole('dialog').query()).toBeNull();
  });
});

describe('closing the menu', () => {
  test('closes on a touch beside it', async () => {
    const { screen } = await showInbox(390, 844);
    const menu = await openMenu(screen);

    await menu.getByRole('button', { name: 'Fermer le menu' }).click();

    await expect.poll(() => screen.getByRole('dialog').query()).toBeNull();
  });

  test('closes on Escape, and gives the keyboard back to ☰', async () => {
    const { screen } = await showInbox(390, 844);
    await openMenu(screen);

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog').query()).toBeNull();
    await expect.element(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveFocus();
  });
});

describe('where the menu is', () => {
  test('is there on a phone turned sideways too', async () => {
    const { screen } = await showInbox(844, 390);

    await openMenu(screen);
  });

  test('is not there where the sidebar stays on screen', async () => {
    const { screen } = await showInbox(1440, 900);

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' }).query()).toBeNull();
  });
});

describe('new mail from the keyboard', () => {
  test.each([
    ['a phone', 390, 844],
    ['a phone turned sideways', 844, 390],
    ['a computer', 1440, 900],
  ])('opens the new mail once with C on %s', async (_, width, height) => {
    const { router } = await showInbox(width, height);

    await userEvent.keyboard('c');
    await expect.poll(() => router.state.location.pathname).toBe('/inbox/new');
    router.history.back();

    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
  });
});
