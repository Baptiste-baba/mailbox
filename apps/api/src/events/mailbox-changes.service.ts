import { listenToMailboxChanges, type MailboxChangesListener } from '@mailbox/db';
import { mailboxIdSchema, type ServerEvent } from '@mailbox/shared';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  asyncScheduler,
  groupBy,
  interval,
  map,
  merge,
  mergeMap,
  type Observable,
  Subject,
  share,
  takeUntil,
  throttleTime,
} from 'rxjs';

export const EVENTS_DATABASE_URL = Symbol('EVENTS_DATABASE_URL');

/**
 * A mailbox being copied changes about once a second: the app is told at most this often per
 * mailbox, the first change at once, the last one of a burst never lost.
 */
const COALESCING_MS = 1000;
const FIRST_RETRY_DELAY_MS = 1000;
/** Proxies such as `tailscale serve` may close a connection silent for a minute. */
const HEARTBEAT_MS = 30_000;
const LONGEST_RETRY_DELAY_MS = 30_000;

/**
 * The changes of the mailboxes the worker tells on Postgres, for the app to hear as they happen,
 * with a heartbeat now and then. One connection listens for every client; when it is lost,
 * another is opened, and the clients are told to read everything again, as changes may have been
 * missed meanwhile.
 */
@Injectable()
export class MailboxChangesService implements OnModuleInit, OnModuleDestroy {
  private listener: MailboxChangesListener | undefined;
  private retry: NodeJS.Timeout | undefined;
  private stopped = false;
  private readonly changes = new Subject<string>();
  private readonly resyncs = new Subject<ServerEvent>();
  private readonly closing = new Subject<void>();
  readonly events: Observable<ServerEvent>;

  constructor(
    @Inject(EVENTS_DATABASE_URL) private readonly databaseUrl: string,
    @InjectPinoLogger(MailboxChangesService.name) private readonly logger: PinoLogger,
  ) {
    const mailboxChanges = this.changes.pipe(
      groupBy((mailboxId) => mailboxId),
      mergeMap((ofMailbox) =>
        ofMailbox.pipe(
          throttleTime(COALESCING_MS, asyncScheduler, { leading: true, trailing: true }),
        ),
      ),
      map((mailboxId): ServerEvent => ({ type: 'mailboxChanged', mailboxId })),
    );
    const heartbeats = interval(HEARTBEAT_MS).pipe(map((): ServerEvent => ({ type: 'heartbeat' })));
    // Shared by every client; ends with the api, so that its open streams end with it.
    this.events = merge(mailboxChanges, this.resyncs, heartbeats).pipe(
      takeUntil(this.closing),
      share(),
    );
  }

  // The api starts without its database, as its health tells: listening is tried again later.
  async onModuleInit(): Promise<void> {
    await this.listen().catch((error: unknown) => {
      this.logger.warn({ err: error }, 'Could not listen to mailbox changes');
      this.listenAgain(FIRST_RETRY_DELAY_MS);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    clearTimeout(this.retry);
    this.closing.next();
    await this.listener?.close();
  }

  private async listen(): Promise<void> {
    const listener = await listenToMailboxChanges(this.databaseUrl, {
      onChange: (payload) => this.hear(payload),
      onLost: (error) => {
        this.logger.warn({ err: error }, 'Lost the connection listening to mailbox changes');
        this.listenAgain(FIRST_RETRY_DELAY_MS);
      },
    });
    // Opened while the api was stopping: it would keep the process alive.
    if (this.stopped) {
      await listener.close();
      return;
    }
    this.listener = listener;
  }

  private hear(payload: string): void {
    const mailboxId = mailboxIdSchema.safeParse(payload);
    if (mailboxId.success) {
      this.changes.next(mailboxId.data);
    } else {
      this.logger.warn('Ignored a mailbox change whose payload is no mailbox id');
    }
  }

  private listenAgain(delayMs: number): void {
    this.retry = setTimeout(() => {
      this.listen().then(
        () => this.resyncs.next({ type: 'resync' }),
        (error: unknown) => {
          this.logger.warn({ err: error, delayMs }, 'Could not listen to mailbox changes again');
          this.listenAgain(Math.min(delayMs * 2, LONGEST_RETRY_DELAY_MS));
        },
      );
    }, delayMs);
  }
}
