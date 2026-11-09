/** The request never got an answer: the server is down, or the network between is. */
export class ServerUnreachableError extends Error {
  override readonly name = 'ServerUnreachableError';

  constructor(cause: unknown) {
    super('The api could not be reached', { cause });
  }
}
