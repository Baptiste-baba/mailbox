import { AppError } from '@mailbox/shared';

const ATTEMPT_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const FIRST_RETRY_DELAY_MS = 500;
const TOO_MANY_REQUESTS = 429;
const FIRST_SERVER_ERROR = 500;

/** An attempt that got no final answer, with what went wrong. */
interface LostAttempt {
  failure: unknown;
}

/**
 * Sends a request to a mail provider and gives its answer, whatever its status. An attempt lost to
 * the network, left without answer for ten seconds, refused for going too fast (429) or failed on
 * the provider's side (5xx) is made again, after a wait that doubles each time. Any other answer
 * is final: asking again would get the same.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE when no attempt got a final answer.
 */
export async function sendRequest(url: string, init: RequestInit): Promise<Response> {
  let lastFailure: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await wait(FIRST_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
    const outcome = await attemptRequest(url, init);
    if (outcome instanceof Response) {
      return outcome;
    }
    lastFailure = outcome.failure;
  }
  throw new AppError('MAIL_PROVIDER_UNAVAILABLE', 'The mail provider gave no answer', {
    cause: lastFailure,
  });
}

async function attemptRequest(url: string, init: RequestInit): Promise<Response | LostAttempt> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
  } catch (error) {
    // fetch only fails when no answer came: network down, host not found, or time out.
    return { failure: error };
  }
  if (response.status === TOO_MANY_REQUESTS || response.status >= FIRST_SERVER_ERROR) {
    await response.body?.cancel();
    return { failure: new Error(`The mail provider answered HTTP ${response.status}`) };
  }
  return response;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
