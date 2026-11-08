import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeApi, testThread } from '../testing/fake-api.ts';
import { renderApp } from '../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  localStorage.clear();
  await page.viewport(1440, 900);
});

describe('shell', () => {
  // Regression: the columns took the height of their content, and the whole page scrolled.
  test('keeps the page at the height of the window: only the columns scroll', async () => {
    const threads = Array.from({ length: 40 }, (_, index) => testThread(`thread-${index}`, false));
    fakeApi({ threadPages: () => ({ threads, nextCursor: null }) });
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-0', { exact: true })).toBeVisible();

    const list = screen.getByRole('region', { name: 'Liste des mails' }).element();
    expect(list.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight);
  });

  test('folds the sidebar to its icons in a narrow window, and gives its width back after', async () => {
    fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
    });
    const { screen } = await renderApp('/inbox');
    const sidebar = screen.getByRole('navigation');
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();
    const sidebarWidth = () => Math.round(sidebar.element().getBoundingClientRect().width);
    const wideWidth = sidebarWidth();

    await page.viewport(1000, 900);
    await expect.poll(sidebarWidth).toBe(56);

    await page.viewport(1440, 900);
    await expect.poll(sidebarWidth).toBe(wideWidth);
  });
});
