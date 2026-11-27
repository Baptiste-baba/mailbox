import type { MailboxSummary, ThreadSummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, testThread } from '../testing/fake-api.ts';
import { serverEvents } from '../testing/fake-event-source.ts';
import { renderApp } from '../testing/render-app.tsx';
import { mailboxSection, personalMailbox } from '../testing/test-mailboxes.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

// Mailbox ids are uuids, as the server tells them.
const personal = personalMailbox.id;

function threadRequests(fetchMock: ReturnType<typeof fakeApi>): number {
  return fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/threads?')).length;
}

describe('following the server as it changes', () => {
  test('shows a new mail without reloading', async () => {
    let threads: ThreadSummary[] = [testThread('thread-a', false)];
    fakeApi({ threadPages: () => ({ threads, nextCursor: null }) });
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText('Sujet thread-a')).toBeVisible();

    threads = [testThread('thread-b', true), ...threads];
    serverEvents().tell({ type: 'mailboxChanged', mailboxId: personal });

    await expect.element(screen.getByText('Sujet thread-b')).toBeVisible();
  });

  test('follows the synchronisation of a mailbox in the settings', async () => {
    let mailbox: MailboxSummary = {
      ...personalMailbox,
      sync: { state: 'copying', copiedCount: 9000, totalCount: 9761 },
    };
    fakeApi({ mailboxes: () => ({ mailboxes: [mailbox] }) });
    const { screen } = await renderApp('/settings');
    const section = mailboxSection(screen);
    await expect.element(section.getByText(/Copie en cours/)).toBeVisible();

    mailbox = { ...personalMailbox, sync: { state: 'upToDate', checkedAt: null } };
    serverEvents().tell({ type: 'mailboxChanged', mailboxId: personalMailbox.id });

    await expect.element(section.getByText('À jour')).toBeVisible();
  });
});

describe('following the server, without reading more than needed', () => {
  test('leaves alone the list of a mailbox another one changed in', async () => {
    const fetchMock = fakeApi();
    const { screen } = await renderApp(`/inbox?mailbox=${personal}`);
    await expect.element(screen.getByText('Aucun mail ici.')).toBeVisible();
    const before = threadRequests(fetchMock);

    serverEvents().tell({ type: 'mailboxChanged', mailboxId: crypto.randomUUID() });
    serverEvents().tell({ type: 'mailboxChanged', mailboxId: personal });

    await expect.poll(() => threadRequests(fetchMock)).toBe(before + 1);
  });

  test('reads everything again once the lost stream is back', async () => {
    let mailboxes: MailboxSummary[] = [];
    fakeApi({ mailboxes: () => ({ mailboxes }) });
    const { screen } = await renderApp('/inbox');
    await expect.element(screen.getByText(/Connecte ta boîte mail/)).toBeVisible();

    mailboxes = [personalMailbox];
    serverEvents().reconnect();

    await expect
      .element(screen.getByRole('navigation').getByText(personalMailbox.address))
      .toBeVisible();
  });
});
