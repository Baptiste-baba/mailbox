import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, testThread } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const threads = [
  testThread('thread-a', true),
  testThread('thread-b', false),
  testThread('thread-c', false),
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mail list, from the keyboard', () => {
  test('opens the next and the previous thread with J and K', async () => {
    fakeApi({ threadPages: () => ({ threads, nextCursor: null }) });
    const { screen, router } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();

    await userEvent.keyboard('j');
    await expect.poll(() => router.state.location.pathname).toBe('/inbox/thread-a');
    await userEvent.keyboard('j');
    await expect.poll(() => router.state.location.pathname).toBe('/inbox/thread-b');
    await userEvent.keyboard('k');

    await expect.poll(() => router.state.location.pathname).toBe('/inbox/thread-a');
    await expect
      .element(screen.getByRole('link', { name: /Sujet thread-a/ }))
      .toHaveAttribute('aria-current', 'page');
  });

  test('shows unread threads only once U is pressed', async () => {
    const fetchMock = fakeApi({
      threadPages: (url) => ({
        threads: url.searchParams.get('unreadOnly') === 'true' ? [] : threads,
        nextCursor: null,
      }),
    });
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();

    await userEvent.keyboard('u');

    await expect.element(screen.getByText('Aucun mail non lu.')).toBeVisible();
    expect(fetchMock.mock.calls.some(([input]) => input.includes('unreadOnly=true'))).toBe(true);
  });
});

describe('mail list, selected row', () => {
  // Regression: the outline of the selected row was cut at the top of the list, covered by the
  // row after it on hover, and touched by that row's hover background.
  test('keeps the whole outline of the selected row in view, above its neighbours', async () => {
    fakeApi({ threadPages: () => ({ threads, nextCursor: null }) });
    const { screen } = await renderApp('/inbox/thread-a');
    const selected = screen.getByRole('link', { name: /Sujet thread-a/ });
    await expect.element(selected).toHaveAttribute('aria-current', 'page');

    const row = selected.element();
    const scrollArea = row.closest('ol')?.parentElement;
    const outlineRoom =
      row.getBoundingClientRect().top - (scrollArea?.getBoundingClientRect().top ?? 0);
    expect(outlineRoom).toBeGreaterThanOrEqual(2);
    const layer = (element: Element | null | undefined) =>
      Number(getComputedStyle(element ?? row).zIndex) || 0;
    const nextRow = screen.getByRole('link', { name: /Sujet thread-b/ }).element();
    expect(layer(row.closest('li'))).toBeGreaterThan(layer(nextRow.closest('li')));
    const spaceBetween = nextRow.getBoundingClientRect().top - row.getBoundingClientRect().bottom;
    expect(spaceBetween).toBeGreaterThanOrEqual(4);
  });
});

describe('mail list, while loading', () => {
  test('loads the next page as the end of the list comes into view', async () => {
    fakeApi({
      threadPages: (url) =>
        url.searchParams.get('cursor') === 'after-c'
          ? { threads: [testThread('thread-d', false)], nextCursor: null }
          : { threads, nextCursor: 'after-c' },
    });
    const { screen } = await renderApp('/inbox');

    await expect.element(screen.getByText('Sujet thread-d')).toBeVisible();
  });

  test('explains a failure to load and offers to try again', async () => {
    fakeApi({
      threadPages: () =>
        Response.json(
          { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          { status: 500 },
        ),
    });
    const { screen } = await renderApp('/inbox');

    await expect.element(screen.getByText(/Impossible de charger les mails/)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  });
});
