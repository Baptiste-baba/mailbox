import type { Thread } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, testMailboxes, testThread } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const own = testMailboxes.mailboxes[0]?.address ?? '';
const nadia = { name: 'Nadia Benali', address: 'nadia@example.com' };

const contract: Thread = {
  id: 'thread-a',
  mailboxId: 'mailbox-personal',
  subject: 'Contrat de prestation',
  messages: [
    {
      id: 'message-1',
      from: nadia,
      to: [{ name: 'Alex', address: own }],
      cc: [],
      sentAt: '2026-11-01T09:00:00.000Z',
      bodyText: 'Première version du contrat.',
      attachments: [],
    },
    {
      id: 'message-2',
      from: nadia,
      to: [{ name: 'Alex', address: own }],
      cc: [],
      sentAt: '2026-11-07T17:42:00.000Z',
      bodyText: 'Bonjour Alex,\n\nVoici la version finale.',
      attachments: [
        { id: 'file-1', fileName: 'Contrat_v3.pdf', mimeType: 'application/pdf', size: 214_016 },
      ],
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('thread pane', () => {
  test('opens the latest message and folds the earlier ones until asked', async () => {
    fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
      thread: () => contract,
    });
    const { screen } = await renderApp('/inbox/thread-a');

    await expect
      .element(screen.getByRole('heading', { name: 'Contrat de prestation' }))
      .toBeVisible();
    await expect.element(screen.getByText('Voici la version finale.')).toBeVisible();
    await expect.element(screen.getByText('Contrat_v3.pdf')).toBeVisible();
    const earlier = screen.getByRole('button', { name: /Première version du contrat/ });
    await expect.element(earlier).toHaveAttribute('aria-expanded', 'false');

    await earlier.click();

    // Unfolded, the message shows its recipients instead of its first line: count the open ones.
    await expect
      .poll(() => screen.getByRole('button', { expanded: true }).elements().length)
      .toBe(2);
  });

  test('says when the thread no longer exists', async () => {
    fakeApi({ threadPages: () => ({ threads: [], nextCursor: null }) });
    const { screen } = await renderApp('/inbox/thread-gone');

    await expect.element(screen.getByText(/Ce mail n’existe plus/)).toBeVisible();
  });
});
