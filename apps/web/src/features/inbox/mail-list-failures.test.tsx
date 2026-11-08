import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, serverError, testMailboxes, testThread } from '../../testing/fake-api.ts';
import { refreshAndFail } from '../../testing/refresh-with-failure.ts';
import { renderApp } from '../../testing/render-app.tsx';

const threads = [
  testThread('thread-a', true),
  testThread('thread-b', false),
  testThread('thread-c', false),
];

afterEach(() => {
  vi.unstubAllGlobals();
});

// Regression: a request failing once mail was on screen replaced that mail with an error.
describe('mail list, when a request fails once mail is on screen', () => {
  test('keeps the threads and the mailboxes when a refresh fails', async () => {
    let failing = false;
    fakeApi({
      threadPages: () => (failing ? serverError() : { threads, nextCursor: null }),
      mailboxes: () => (failing ? serverError() : testMailboxes),
    });
    const { screen, queryClient } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();

    failing = true;
    await refreshAndFail(queryClient);

    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();
    const sidebar = screen.getByRole('navigation');
    await expect.element(sidebar.getByRole('link', { name: /Perso/ })).toBeVisible();
    expect(screen.getByText(/Impossible de charger/).query()).toBeNull();
  });

  test('keeps the loaded threads when the next page fails, and asks again on request only', async () => {
    let nextPageFails = true;
    const fetchMock = fakeApi({
      threadPages: (url) => {
        if (url.searchParams.get('cursor') !== 'after-c') {
          return { threads, nextCursor: 'after-c' };
        }
        return nextPageFails
          ? serverError()
          : { threads: [testThread('thread-d', false)], nextCursor: null };
      },
    });
    const { screen } = await renderApp('/inbox');

    await expect.element(screen.getByText('Impossible de charger la suite.')).toBeVisible();
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const nextPageRequests = () =>
      fetchMock.mock.calls.filter(([input]) => input.includes('cursor=after-c'));
    expect(nextPageRequests()).toHaveLength(1);

    nextPageFails = false;
    await screen.getByRole('button', { name: 'Réessayer' }).click();

    await expect.element(screen.getByText('Sujet thread-d')).toBeVisible();
  });
});
