import { setTimeout as wait } from 'node:timers/promises';

/**
 * The pace at which the mails of a mailbox are read at its provider, whatever reads them: the copy
 * of the mailbox and the reading of its changes share what the provider allows.
 */
export class ReadPace {
  private readonly nextReadAt = new Map<string, number>();
  private readonly intervalMs: number;

  /** @param intervalMs The least time between two reads of the same mailbox. */
  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  /**
   * Waits for the turn of the next read of a mailbox.
   * @param signal Ends the wait at once, by throwing, when the worker stops.
   */
  async waitForTurn(mailboxId: string, signal: AbortSignal): Promise<void> {
    const now = Date.now();
    const turnAt = Math.max(now, this.nextReadAt.get(mailboxId) ?? 0);
    this.nextReadAt.set(mailboxId, turnAt + this.intervalMs);
    await wait(turnAt - now, undefined, { signal });
  }
}
