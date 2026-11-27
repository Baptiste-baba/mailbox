import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeApi } from '../testing/fake-api.ts';
import { fakeThreads } from '../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../testing/render-app.tsx';

/** What iOS leaves to an app installed on the home screen of an iPhone: the blur below its status
 * bar at the top, the home bar at the foot. */
const SCREEN_TOP = 36;
const SCREEN_BOTTOM = 34;

function installOnIphone() {
  document.documentElement.style.setProperty('--screen-top', `${SCREEN_TOP}px`);
  document.documentElement.style.setProperty('--screen-bottom', `${SCREEN_BOTTOM}px`);
}

afterEach(async () => {
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty('--screen-top');
  document.documentElement.style.removeProperty('--screen-bottom');
  await page.viewport(1440, 900);
});

function topOf(screen: AppScreen, role: 'button' | 'heading', name: string): number {
  return screen.getByRole(role, { name }).element().getBoundingClientRect().top;
}

async function openOnIphone(path: string): Promise<AppScreen> {
  installOnIphone();
  fakeThreads(3);
  await page.viewport(390, 844);
  const { screen } = await renderApp(path);
  return screen;
}

describe('app installed on an iPhone', () => {
  test('keeps the top of the list clear of the blur below the status bar', async () => {
    const screen = await openOnIphone('/inbox');
    await expect.element(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeVisible();

    expect(topOf(screen, 'button', 'Ouvrir le menu')).toBeGreaterThanOrEqual(SCREEN_TOP);
  });

  test('sets "Nouveau mail" just above the home bar', async () => {
    const screen = await openOnIphone('/inbox');
    const button = screen.getByRole('button', { name: 'Nouveau mail' });
    await expect.element(button).toBeVisible();

    expect(button.element().getBoundingClientRect().bottom).toBe(844 - SCREEN_BOTTOM);
  });

  test('keeps the way back of a mail clear of the blur below the status bar, its reply above the home bar', async () => {
    const screen = await openOnIphone('/inbox/thread-1');
    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();

    expect(topOf(screen, 'button', 'Retour')).toBeGreaterThanOrEqual(SCREEN_TOP);
    const send = screen.getByRole('button', { name: 'Envoyer' }).element();
    expect(send.getBoundingClientRect().bottom).toBeLessThanOrEqual(844 - SCREEN_BOTTOM);
  });

  test('keeps the menu clear of the blur below the status bar and the home bar', async () => {
    const screen = await openOnIphone('/inbox');
    await screen.getByRole('button', { name: 'Ouvrir le menu' }).click();
    const settings = screen.getByRole('link', { name: 'Réglages' });
    await expect.element(settings).toBeVisible();

    const brand = screen.getByText('MailBox', { exact: true }).element();
    expect(brand.getBoundingClientRect().top).toBeGreaterThanOrEqual(SCREEN_TOP);
    expect(settings.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
      844 - SCREEN_BOTTOM,
    );
  });
});

describe('pages of an app installed on an iPhone', () => {
  test('keeps the title of the settings clear of the blur below the status bar', async () => {
    const screen = await openOnIphone('/settings');
    await expect.element(screen.getByRole('heading', { name: 'Réglages' })).toBeVisible();

    expect(topOf(screen, 'heading', 'Réglages')).toBeGreaterThanOrEqual(SCREEN_TOP);
  });

  test('keeps the logo of the sign-in clear of the blur below the status bar', async () => {
    installOnIphone();
    fakeApi({ authStatus: () => ({ state: 'signedOut' }) });
    await page.viewport(390, 844);
    const { screen } = await renderApp('/login');
    const brand = screen.getByText('MailBox', { exact: true });
    await expect.element(brand).toBeVisible();

    expect(brand.element().getBoundingClientRect().top).toBeGreaterThanOrEqual(SCREEN_TOP);
  });
});

describe('app in a browser tab', () => {
  test('starts the list at its usual place, nothing to keep clear of', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeVisible();

    expect(topOf(screen, 'button', 'Ouvrir le menu')).toBeLessThan(40);
  });
});
