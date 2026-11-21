import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONNECTION_LIFETIME_MS,
  type PendingConnection,
  PendingConnections,
} from './pending-connections.ts';

const connection: PendingConnection = {
  provider: 'gmail',
  codeVerifier: 'the-verifier',
  target: { kind: 'newMailbox', name: 'Perso', color: 'navy' },
};

let pendingConnections: PendingConnections;

beforeEach(() => {
  vi.useFakeTimers();
  pendingConnections = new PendingConnections();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('a connection whose user is signing in at the provider', () => {
  it('is given back to the session that started it', () => {
    const state = pendingConnections.start(connection, 'session-token');

    expect(pendingConnections.consume(state, 'session-token')).toEqual(connection);
  });

  it('is named by a state no one can guess, different each time', () => {
    const state = pendingConnections.start(connection, 'session-token');

    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pendingConnections.start(connection, 'session-token')).not.toBe(state);
  });

  it('works once', () => {
    const state = pendingConnections.start(connection, 'session-token');
    pendingConnections.consume(state, 'session-token');

    expect(pendingConnections.consume(state, 'session-token')).toBeUndefined();
  });

  it('is not given to another session, and is lost to both', () => {
    const state = pendingConnections.start(connection, 'session-token');

    expect(pendingConnections.consume(state, 'other-session-token')).toBeUndefined();
    expect(pendingConnections.consume(state, 'session-token')).toBeUndefined();
  });

  it('is unknown under a state that was never given', () => {
    expect(pendingConnections.consume('made-up-state', 'session-token')).toBeUndefined();
  });
});

describe('the ten minutes a connection waits', () => {
  it('still gives the connection just before they end', () => {
    const state = pendingConnections.start(connection, 'session-token');
    vi.advanceTimersByTime(CONNECTION_LIFETIME_MS - 1);

    expect(pendingConnections.consume(state, 'session-token')).toEqual(connection);
  });

  it('no longer gives it once they are over', () => {
    const state = pendingConnections.start(connection, 'session-token');
    vi.advanceTimersByTime(CONNECTION_LIFETIME_MS);

    expect(pendingConnections.consume(state, 'session-token')).toBeUndefined();
  });
});
