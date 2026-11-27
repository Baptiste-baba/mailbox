import { setTimeout as wait } from 'node:timers/promises';
import { type ServerEvent, serverEventSchema } from '@mailbox/shared';

export interface EventStream {
  /** The next event the server tells, heartbeats left out. */
  next: () => Promise<ServerEvent>;
  /** The events told within the given time, heartbeats left out. */
  within: (milliseconds: number) => Promise<ServerEvent[]>;
  close: () => void;
}

function eventsOf(blocks: string[]): ServerEvent[] {
  return blocks.flatMap((block) => {
    const data = block.split('\n').find((line) => line.startsWith('data: '));
    const event =
      data === undefined ? undefined : serverEventSchema.parse(JSON.parse(data.slice(6)));
    return event === undefined || event.type === 'heartbeat' ? [] : [event];
  });
}

/** Opens the stream of server events as a browser does, and reads its events as they come. */
export async function openEventStream(url: string, cookie: string): Promise<EventStream> {
  const abort = new AbortController();
  const response = await fetch(url, { headers: { cookie }, signal: abort.signal });
  if (response.body === null || !response.ok) {
    throw new Error(`The event stream answered HTTP ${response.status}`);
  }
  const body = response.body.pipeThrough(new TextDecoderStream());
  const told: ServerEvent[] = [];
  let wake = () => {};
  const reading = (async () => {
    let buffered = '';
    for await (const chunk of body) {
      const blocks = (buffered + chunk).split('\n\n');
      buffered = blocks.pop() ?? '';
      told.push(...eventsOf(blocks));
      wake();
    }
  })();
  // Closing the stream ends the reading with an abort: anything else fails the test.
  reading.catch((error: unknown) => {
    if (!abort.signal.aborted) {
      throw error;
    }
  });
  return {
    next: async () => {
      let event = told.shift();
      while (event === undefined) {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
        event = told.shift();
      }
      return event;
    },
    within: async (milliseconds) => {
      await wait(milliseconds);
      return told.splice(0);
    },
    close: () => abort.abort(),
  };
}
