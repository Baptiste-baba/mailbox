import type { Thread } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, testThread } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

function openThread(id: string): Thread {
  const { mailboxId, subject, sender, lastMessageAt } = testThread(id, false);
  return {
    id,
    mailboxId,
    subject,
    messages: [
      {
        id: `${id}-message`,
        from: sender,
        to: [],
        cc: [],
        sentAt: lastMessageAt,
        bodyText: 'Bonjour,',
        attachments: [],
      },
    ],
  };
}

function listWith(...threadIds: string[]) {
  fakeApi({
    threadPages: () => ({
      threads: threadIds.map((id) => testThread(id, false)),
      nextCursor: null,
    }),
    thread: openThread,
  });
}

describe('new mail, from a mail view', () => {
  test('opens from "Nouveau mail", and closing goes back to the mail being read', async () => {
    listWith('thread-a');
    const { screen, router } = await renderApp('/inbox/thread-a');
    await expect.element(screen.getByRole('heading', { name: 'Sujet thread-a' })).toBeVisible();

    await screen.getByRole('button', { name: 'Nouveau mail' }).click();
    await expect.element(screen.getByRole('heading', { name: 'Nouveau mail' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/inbox/new');
    await expect.element(screen.getByText('Sujet thread-a', { exact: true })).toBeVisible();

    await screen.getByRole('button', { name: 'Fermer' }).click();
    await expect.element(screen.getByRole('heading', { name: 'Sujet thread-a' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/inbox/thread-a');
  });

  test('opens with C beside the same list, and closes with Escape', async () => {
    listWith('thread-a');
    const { screen, router } = await renderApp('/inbox?mailbox=mailbox-personal');
    await expect.element(screen.getByText('Sujet thread-a', { exact: true })).toBeVisible();

    await userEvent.keyboard('c');
    await expect.element(screen.getByRole('heading', { name: 'Nouveau mail' })).toBeVisible();
    expect(router.state.location).toMatchObject({
      pathname: '/inbox/new',
      search: { mailbox: 'mailbox-personal' },
    });

    await userEvent.keyboard('{Escape}');
    await expect
      .element(screen.getByRole('heading', { name: 'Nouveau mail' }))
      .not.toBeInTheDocument();
    expect(router.state.location).toMatchObject({
      pathname: '/inbox',
      search: { mailbox: 'mailbox-personal' },
    });
  });
});

describe('new mail, at its own address', () => {
  test('opened from its address alone, closes on the list', async () => {
    listWith('thread-a');
    const { screen, router } = await renderApp('/all/new');
    await expect.element(screen.getByRole('heading', { name: 'Nouveau mail' })).toBeVisible();

    await screen.getByRole('button', { name: 'Fermer' }).click();
    await expect
      .element(screen.getByRole('heading', { name: 'Nouveau mail' }))
      .not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/all');
  });

  test('shows sending and attaching before they exist, doing nothing', async () => {
    listWith();
    const { screen } = await renderApp('/inbox/new');

    await expect
      .element(screen.getByRole('button', { name: 'Envoyer' }))
      .toHaveAttribute('aria-disabled', 'true');
    await expect
      .element(screen.getByRole('button', { name: 'Joindre un fichier' }))
      .toHaveAttribute('aria-disabled', 'true');
  });
});
