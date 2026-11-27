import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeThreads } from '../../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

async function showLongList() {
  fakeThreads(40);
  await page.viewport(390, 844);
  const rendered = await renderApp('/inbox');
  await expect.element(rendered.screen.getByText('Sujet thread-0', { exact: true })).toBeVisible();
  return rendered;
}

/** The element that scrolls the threads: the parent of their list. */
function scrollerOf(screen: AppScreen): HTMLElement {
  const scroller = screen.getByRole('list').element().parentElement;
  if (scroller === null) {
    throw new Error('The list of threads has no scroll area.');
  }
  return scroller;
}

function backToTop(screen: AppScreen) {
  return screen.getByRole('button', { name: 'Revenir en haut de la liste' });
}

/** Whether touch and keyboard can reach the element: neither it nor a parent is inert. */
function isUsable(element: Element): boolean {
  return element.closest('[inert]') === null;
}

/** The choices between every thread and unread ones that can be used now. */
function usableFilters(screen: AppScreen) {
  return screen
    .getByRole('radiogroup', { name: 'Afficher' })
    .all()
    .filter((group) => isUsable(group.element()));
}

describe('list header on a phone', () => {
  test('shows the title, the tabs and the search at rest, no bubble', async () => {
    const { screen } = await showLongList();

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    await expect.element(screen.getByRole('searchbox')).toBeVisible();
    expect(isUsable(backToTop(screen).element())).toBe(false);
    expect(usableFilters(screen)).toHaveLength(1);
  });

  test('runs the list from the very top of the screen, under the bubbles', async () => {
    const { screen } = await showLongList();

    expect(scrollerOf(screen).getBoundingClientRect().top).toBe(0);
  });

  test('turns into bubbles once the list scrolls, and brings the list back to its top', async () => {
    const { screen } = await showLongList();
    const scroller = scrollerOf(screen);
    scroller.scrollTop = 600;

    await expect.poll(() => isUsable(backToTop(screen).element())).toBe(true);
    expect(usableFilters(screen)).toHaveLength(1);
    await backToTop(screen).click();

    await expect.poll(() => scroller.scrollTop).toBe(0);
    await expect.poll(() => isUsable(backToTop(screen).element())).toBe(false);
  });

  test('filters the list from the bubble once scrolled', async () => {
    const { screen, router } = await showLongList();
    scrollerOf(screen).scrollTop = 600;
    await expect.poll(() => isUsable(backToTop(screen).element())).toBe(true);
    const [bubble] = usableFilters(screen);

    await bubble?.getByText('Non lus').click();

    await expect.poll(() => router.state.location.search).toEqual({ unread: true });
  });
});

describe('list header settling on a phone', () => {
  test.each([
    ['back at rest, scrolled less than half way', 30, 0],
    ['into bubbles, scrolled more than half way', 70, 96],
  ])('goes on %s', async (_, scrolled, settled) => {
    const { screen } = await showLongList();
    const scroller = scrollerOf(screen);

    scroller.scrollTop = scrolled;

    await expect.poll(() => scroller.scrollTop).toBe(settled);
  });
});

describe('list header on a computer', () => {
  test('stays above the threads, without bubbles', async () => {
    fakeThreads(40);
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-0', { exact: true })).toBeVisible();

    scrollerOf(screen).scrollTop = 600;

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    expect(backToTop(screen).query()).toBeNull();
    expect(scrollerOf(screen).getBoundingClientRect().top).toBeGreaterThan(100);
  });
});
