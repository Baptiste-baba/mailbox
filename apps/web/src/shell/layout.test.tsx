import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { fakeApi, testThread } from '../testing/fake-api.ts';
import { renderApp } from '../testing/render-app.tsx';
import { useLayout } from './layout.ts';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

function LayoutName() {
  return <p>{useLayout()}</p>;
}

describe('layout', () => {
  test('follows the size of the window, not the kind of device', async () => {
    await page.viewport(390, 844);
    const screen = await render(<LayoutName />);
    await expect.element(screen.getByText('phone')).toBeVisible();

    await page.viewport(844, 390);
    await expect.element(screen.getByText('landscape')).toBeVisible();

    await page.viewport(1440, 900);
    await expect.element(screen.getByText('desktop')).toBeVisible();

    // A computer window made narrow behaves as a phone.
    await page.viewport(700, 900);
    await expect.element(screen.getByText('phone')).toBeVisible();
  });

  test('shows the screen alone, without the sidebar, on a phone', async () => {
    fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
    });
    await page.viewport(390, 844);
    const { screen } = await renderApp('/inbox');

    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();
    expect(screen.getByRole('navigation').query()).toBeNull();
    expect(screen.getByRole('separator').query()).toBeNull();
  });
});
