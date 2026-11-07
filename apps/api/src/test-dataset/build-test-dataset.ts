import type { Message } from '@mailbox/shared';
import { generatedThreadSeeds } from './generated-thread-seeds.ts';
import { personalThreadSeeds } from './personal-thread-seeds.ts';
import type { TestDataset, TestThread } from './test-dataset.ts';
import { testFolders, testMailboxes } from './test-mailboxes.ts';
import type { MessageSeed, ThreadSeed } from './thread-seed.ts';
import { workThreadSeeds } from './work-thread-seeds.ts';

const threadSeeds: ThreadSeed[] = [
  ...workThreadSeeds,
  ...personalThreadSeeds,
  ...generatedThreadSeeds,
];

/** Builds the test dataset, dated relative to `now` so that it always looks recent. */
export function buildTestDataset(now: Date): TestDataset {
  return {
    mailboxes: testMailboxes,
    folders: testFolders,
    threads: threadSeeds.map((seed, index) => buildThread(seed, `thread-${index + 1}`, now)),
  };
}

function buildThread(seed: ThreadSeed, id: string, now: Date): TestThread {
  return {
    id,
    mailboxId: seed.mailboxId,
    subject: seed.subject,
    unread: seed.unread ?? false,
    inInbox: !(seed.archived ?? false),
    messages: seed.messages.map((message, index) =>
      buildMessage(message, `${id}-message-${index + 1}`, now),
    ),
  };
}

function buildMessage(seed: MessageSeed, id: string, now: Date): Message {
  return {
    id,
    from: seed.from,
    to: seed.to,
    cc: seed.cc ?? [],
    sentAt: new Date(now.getTime() - seed.minutesAgo * 60_000).toISOString(),
    bodyText: seed.body,
    attachments: (seed.attachments ?? []).map((attachment, index) => ({
      id: `${id}-attachment-${index + 1}`,
      ...attachment,
    })),
  };
}
