import type { ServerEvent } from '@mailbox/shared';

/**
 * Stands for the browser's EventSource in tests: the app listens to it as to the server, and the
 * test tells what the server would.
 */
export class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  /** The streams the app opened, the latest last. */
  static opened: FakeEventSource[] = [];

  readonly url: string;
  readyState: number = FakeEventSource.CONNECTING;
  onmessage: ((message: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.opened.push(this);
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED;
  }

  /** The server tells an event. */
  tell(event: ServerEvent): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(event) }));
  }

  /** The connection opens. */
  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.onopen?.();
  }

  /** The connection is lost, then the browser opens it again. */
  reconnect(): void {
    this.readyState = FakeEventSource.CONNECTING;
    this.onerror?.();
    this.open();
  }

  /**
   * The browser gives the stream up for good, as it does when an answer is no stream: the 502 of
   * a proxy while the api restarts, a 401 once the session is over.
   */
  giveUp(): void {
    this.readyState = FakeEventSource.CLOSED;
    this.onerror?.();
  }
}

/** The stream the app listens to now. */
export function serverEvents(): FakeEventSource {
  const open = FakeEventSource.opened.findLast(
    (source) => source.readyState !== FakeEventSource.CLOSED,
  );
  if (open === undefined) {
    throw new Error('The app listens to no server events');
  }
  return open;
}
