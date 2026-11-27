import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fakeThreads } from '../../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

function listRegion(screen: AppScreen) {
  return screen.getByRole('region', { name: 'Liste des mails' });
}

/** The element that scrolls the threads: the parent of their list. */
function listScroller(screen: AppScreen): HTMLElement {
  const scroller = screen.getByRole('list').element().parentElement;
  if (scroller === null) {
    throw new Error('The list of threads has no scroll area.');
  }
  return scroller;
}

describe('mail view on a phone', () => {
  test('opens a thread over the whole screen, and comes back to the list where it was', async () => {
    fakeThreads(40);
    await page.viewport(390, 844);
    const { screen, router } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-0', { exact: true })).toBeVisible();
    listScroller(screen).scrollTop = 1200;
    const thread = screen.getByRole('link', { name: /Sujet thread-12\b/ });
    await thread.click();

    await expect.element(screen.getByText('Corps de thread-12')).toBeVisible();
    expect(listRegion(screen).query()).toBeNull();

    await screen.getByRole('button', { name: 'Retour' }).click();

    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
    await expect.element(listRegion(screen)).toBeVisible();
    expect(listScroller(screen).scrollTop).toBe(1200);
  });
});

describe('list on a phone', () => {
  test('keeps the cards and the search close to the edges of the screen', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen } = await renderApp('/inbox');
    const card = screen.getByRole('link', { name: /Sujet thread-0\b/ });
    await expect.element(card).toBeVisible();

    const cardLeft = card.element().getBoundingClientRect().left;
    const search = screen.getByRole('searchbox').element().closest('label, div');
    expect(cardLeft).toBe(8);
    expect(search?.getBoundingClientRect().left).toBe(cardLeft);
  });
});

describe('way back from a thread', () => {
  test('goes back to the list of a thread opened from its address alone', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen, router } = await renderApp('/inbox/thread-1');
    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();

    await screen.getByRole('button', { name: 'Retour' }).click();

    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
    await expect.element(screen.getByText('Sujet thread-1', { exact: true })).toBeVisible();
  });

  test('keeps the way back on a thread that no longer exists', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen, router } = await renderApp('/inbox/thread-gone');
    await expect.element(screen.getByText(/Ce mail n’existe plus/)).toBeVisible();

    await screen.getByRole('button', { name: 'Retour' }).click();

    await expect.poll(() => router.state.location.pathname).toBe('/inbox');
  });

  test('shows no way back where the list stays beside the thread', async () => {
    fakeThreads(3);
    const { screen } = await renderApp('/inbox/thread-1');
    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();

    expect(screen.getByRole('button', { name: 'Retour' }).query()).toBeNull();
  });
});

describe('mail view on a phone turned sideways', () => {
  test('shows the list beside the thread, without the sidebar or a handle to resize', async () => {
    fakeThreads(3);
    await page.viewport(844, 390);
    const { screen } = await renderApp('/inbox/thread-1');

    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();
    await expect.element(screen.getByText('Sujet thread-2', { exact: true })).toBeVisible();
    expect(screen.getByRole('navigation').query()).toBeNull();
    expect(screen.getByRole('separator').query()).toBeNull();
  });

  test('keeps the open thread when the phone turns upright, then over the whole screen', async () => {
    fakeThreads(3);
    await page.viewport(844, 390);
    const { screen } = await renderApp('/inbox/thread-1');
    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();

    await page.viewport(390, 844);

    await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();
    await expect.poll(() => listRegion(screen).query()).toBeNull();
  });
});

describe('new mail across layouts', () => {
  test('keeps what was written when the window changes layout', async () => {
    fakeThreads(3);
    await page.viewport(390, 844);
    const { screen } = await renderApp('/inbox/new');
    await userEvent.type(screen.getByRole('textbox', { name: 'Objet' }), 'Dîner samedi');

    await page.viewport(1440, 900);

    await expect
      .element(screen.getByRole('textbox', { name: 'Objet' }))
      .toHaveValue('Dîner samedi');
  });
});
