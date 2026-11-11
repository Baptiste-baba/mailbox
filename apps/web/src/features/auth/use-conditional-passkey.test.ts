import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi } from '../../testing/fake-api.ts';
import {
  testPasskeyRequestOptions,
  waitForeverForPick,
} from '../../testing/virtual-authenticator.ts';
import { SUGGESTION_RENEWAL_MS, waitForSuggestedPasskey } from './use-conditional-passkey.ts';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('passkeys suggested in the username field', () => {
  test('asks again before the challenge expires, until stopped', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fakeApi({ passkeyLoginOptions: testPasskeyRequestOptions });
    const browser = vi.spyOn(navigator.credentials, 'get').mockImplementation(waitForeverForPick);
    const controller = new AbortController();

    const waiting = waitForSuggestedPasskey(controller.signal);
    await vi.waitFor(() => expect(browser).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(SUGGESTION_RENEWAL_MS);
    await vi.waitFor(() => expect(browser).toHaveBeenCalledTimes(2));
    controller.abort();

    expect(await waiting).toBeUndefined();
    expect(browser).toHaveBeenCalledTimes(2);
    expect(browser.mock.calls.every(([request]) => request?.mediation === 'conditional')).toBe(
      true,
    );
  });

  test('ends quietly when the browser gives up, and asks no more', async () => {
    const fetchMock = fakeApi({ passkeyLoginOptions: testPasskeyRequestOptions });
    vi.spyOn(navigator.credentials, 'get').mockRejectedValue(
      new DOMException('Declined', 'NotAllowedError'),
    );

    expect(await waitForSuggestedPasskey(new AbortController().signal)).toBeUndefined();

    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/options'))).toHaveLength(1);
  });
});
