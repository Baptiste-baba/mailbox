import type { ServerEvent } from '@mailbox/shared';

/**
 * Stands for the browser's EventSource in tests: the app listens to it as to the server, and the
 * test tells what the server would.
 */
export class FakeEventSource {
  /** The streams the app opened, the latest last. */
  static opened: FakeEventSource[] = [];

  readonly url: string;
  closed = false;
  onmessage: ((message: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.opened.push(this);
  }

  close(): void {
    this.closed = true;
  }

  /** The server tells an event. */
  tell(event: ServerEvent): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(event) }));
  }

  /** The connection is lost, then the browser opens it again. */
  reconnect(): void {
    this.onerror?.();
    this.onopen?.();
  }
}

/** The stream the app listens to now. */
export function serverEvents(): FakeEventSource {
  const open = FakeEventSource.opened.findLast((source) => !source.closed);
  if (open === undefined) {
    throw new Error('The app listens to no server events');
  }
  return open;
}
