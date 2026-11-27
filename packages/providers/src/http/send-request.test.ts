import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendRequest } from './send-request.ts';

const URL_ASKED = 'https://provider.example.test/resource';
const fetchMock = vi.fn<typeof fetch>();

function answer(status: number): Response {
  return new Response(null, { status });
}

/** Lets the waits between attempts pass, then gives what the request ended with. */
async function outcomeOf(request: Promise<Response>): Promise<unknown> {
  const outcome = request.catch((error: unknown) => error);
  await vi.runAllTimersAsync();
  return outcome;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('sendRequest, when the provider answers', () => {
  it('gives the answer whatever its status, without asking twice', async () => {
    fetchMock.mockResolvedValueOnce(answer(404));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks again after a failure on the side of the provider', async () => {
    fetchMock.mockResolvedValueOnce(answer(503)).mockResolvedValueOnce(answer(200));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('asks again when the provider says it goes too fast', async () => {
    fetchMock.mockResolvedValueOnce(answer(429)).mockResolvedValueOnce(answer(200));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ status: 200 });
  });

  it('asks again when the network loses the request', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(answer(200));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ status: 200 });
  });
});

describe('sendRequest, when the provider stays out of reach', () => {
  it('gives up after three attempts', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(answer(503)));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ code: 'MAIL_PROVIDER_UNAVAILABLE' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('keeps what went wrong as the cause of the error', async () => {
    const networkDown = new TypeError('fetch failed');
    fetchMock.mockRejectedValue(networkDown);

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}));

    expect(outcome).toMatchObject({ code: 'MAIL_PROVIDER_UNAVAILABLE', cause: networkDown });
  });

  it('waits twice as long before each new attempt', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(answer(503)));
    const outcome = sendRequest(URL_ASKED, {}).catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(499);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await outcome;
  });
});

describe('sendRequest, with a provider that asks to slow down in its own way', () => {
  const slowDownUnder403 = (refusal: Response) => Promise.resolve(refusal.status === 403);

  it('asks again what the provider refused only for coming too fast', async () => {
    fetchMock.mockResolvedValueOnce(answer(403)).mockResolvedValueOnce(answer(200));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}, slowDownUnder403));

    expect(outcome).toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives any other refusal as it is, without asking twice', async () => {
    fetchMock.mockResolvedValueOnce(answer(401));

    const outcome = await outcomeOf(sendRequest(URL_ASKED, {}, slowDownUnder403));

    expect(outcome).toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
