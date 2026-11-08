import { Injectable } from '@nestjs/common';

export interface StartedSession {
  /** Goes into the cookie; only its hash is stored. */
  token: string;
  expiresAt: Date;
}

/** Signed-in devices: start, resume and end a session. */
@Injectable()
export class SessionService {
  start(_userAgent: string): Promise<StartedSession> {
    throw new Error('Not implemented yet');
  }

  /** The session of a token, its expiry pushed back, or undefined when it is unknown or expired. */
  resume(_token: string): Promise<{ id: string; expiresAt: Date } | undefined> {
    throw new Error('Not implemented yet');
  }

  end(_token: string): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
