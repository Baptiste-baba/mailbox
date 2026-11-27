import { describe, expect, test, vi } from 'vitest';
import { listenToMailboxChanges } from './mailbox-changes.ts';

/** Nothing listens on port 1: a connection there is refused at once. */
const UNREACHABLE_DATABASE_URL = 'postgres://mailbox:secret@127.0.0.1:1/mailbox';

describe('listening to the changes of the mailboxes', () => {
  // Regression: a connection that failed to open was told lost as well, so that each failure was
  // tried again twice, and the attempts doubled every second while the database was away.
  test('tells a connection that fails to open by its rejection alone, never as lost', async () => {
    const onLost = vi.fn();

    await expect(
      listenToMailboxChanges(UNREACHABLE_DATABASE_URL, { onChange: () => {}, onLost }),
    ).rejects.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onLost).not.toHaveBeenCalled();
  });
});
